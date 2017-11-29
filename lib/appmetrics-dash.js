/*******************************************************************************
 * Copyright 2017 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 ******************************************************************************/

'use strict';

const debug = require('debug')('appmetrics-dash');
const util = require('util');

// Buffer 1 cpu, gc and memory event and aggregate other events
var latestCPUEvent;
var latestMemEvent;
var latestGCEvent;
var latestLoopEvent;
var aggregateHttpEvent;
var aggregateHttpOutboundEvent;
var aggregateHttpsEvent;
var aggregateHttpsOutboundEvent;
var aggregateProbeEvents = [];
// Used for top 5 response times
var httpURLData = {};
// Interval between emitting data in milliseconds
var emitInterval = 2000;
// CPU summary data
let totalProcessCPULoad = 0.0;
let totalSystemCPULoad = 0.0;
let cpuLoadSamples = 0;
// GC summary data
let gcDurationTotal = 0.0;
let maxHeapUsed = 0;

var io;

var save = {
  http: {},
  https: {},
};

let profiling_enabled = false;

exports.attach = function(options) {
  if (save.http.Server) {
    // Already attached.
    return exports;
  }
  // Protect our options from modification.
  options = util._extend({}, options);

  // if the user hasn't supplied appmetrics, require
  // here so we get http probe data
  if (!options.appmetrics) {
    options.appmetrics = require('appmetrics');
  }

  patch(save.http, require('http'));
  patch(save.https, require('https'));

  function patch(save, http) {
    // Patch the constructor as well as createServer.
    save.Server = http.Server;
    http.Server = function() {
      const server = save.Server.apply(this, arguments);
      options.server = server;
      exports.monitor(options);
      return server;
    };
    save.createServer = http.createServer;
    http.createServer = function() {
      const server = save.createServer.apply(this, arguments);
      options.server = server;
      exports.monitor(options);
      return server;
    };
  }

  return exports;
};

// Start monitoring process and subscribe to the data.
exports.monitor = function(options) {
  // Protect our options from modification.
  options = util._extend({}, options);

  var url = options.url || '/appmetrics-dash';
  var title = options.title || 'Application Metrics for Node.js';
  var docs = options.docs || 'https://developer.ibm.com/node/application-metrics-node-js/';

  options.console = options.console || console;
  var log = options.console.log;
  var error = options.console.error;

  // appmetrics is a global singleton, allow the user's appmetrics to be
  // injected, only using our own if the user did not supply one.
  var appmetrics = options.appmetrics || require('appmetrics');
  // XXX(sam) We should let the user turn monitoring on or off! But we need
  // access to the monitor object to listen for events. Does monitor() actually
  // start appmetrics?
  var monitoring = appmetrics.monitor();
  var express = require('express');
  var nodereport;
  if ('nodereport' in options) {
    nodereport = options.nodereport;
  } else {
    try {
      nodereport = require('node-report/api');
    } catch (err) {
      error('%s: skipping optional dependency', err.message);
    };
  }
  var path = require('path');
  var directory = path.resolve(__dirname, '..', 'public');
  var site = express.static(directory);
  var server;

  if (!options.server) {
    // Create and use our own express server on the user-specified port/host.
    var port = options.port || 3001;  // Set a default port if one is not supplied
    var host = options.host;
    var app = express();
    server = require('http').Server(app);
    // XXX(sam) specify a path, to not collide with user's socket.io. Not
    // changing now, it will need coordination with FE javascript.
    io = require('socket.io')(server);
    app.use(url, site);
    server.listen(port, host, function() {
      var a = this.address();
      log('appmetrics-dash listening on %s:%s', a.address, a.port);
    });
  } else {
    // Use the server that has been defined by the application.
    server = options.server;
    // XXX(sam) specify a path, to not collide with user's socket.io. Not
    // changing now, it will need coordination with FE javascript.
    debug('patch existing request listeners');
    server.listeners('request').forEach(patch);

    // Don't patch socket.io, it already knows to ignore requests that are not
    // its own.
    debug('listen for socket.io');
    io = require('socket.io')(server);

    debug('patch new request listeners...');
    server.on('newListener', function(eventName, listener) {
      if (eventName !== 'request') return;
      if (listener.__dashboard_patched) return;
      process.nextTick(function() { patch(listener); });
    });
  };

  function patch(listener) {
    debug('patching %s', listener);
    server.removeListener('request', listener);
    var app = express();
    app.use(url, site);
    app.use(url, siteNotFound);
    app.use(url, siteError);
    // If request not for the dashboard url, forward it back to the original
    // listener.
    app.use(function(req, res) {
      listener.call(server, req, res);
    });
    app.__dashboard_patched = true;
    server.on('request', app);
  }

  function siteNotFound(req, res) {
    res.statusCode = 404;
    return res.end();
  }

  function siteError(err, req, res, _next) {
    res.statusCode = 500;
    return res.end(err.message);
  }
  /*
   * Publish the environment data to clients when they connect
   */
  io.on('connection', function(socket) {
    var env = monitoring.getEnvironment();
    var envData = [];
    var json;
    for (var entry in env) {
      switch (entry) {
        case 'command.line':
          json = {};
          json['Parameter'] = 'Command Line';
          json['Value'] = env[entry];
          envData.push(json);
          break;
        case 'environment.HOSTNAME':
          json = {};
          json['Parameter'] = 'Hostname';
          json['Value'] = env[entry];
          envData.push(json);
          break;
        case 'os.arch':
          json = {};
          json['Parameter'] = 'OS Architecture';
          json['Value'] = env[entry];
          envData.push(json);
          break;
        case 'number.of.processors':
          json = {};
          json['Parameter'] = 'Number of Processors';
          json['Value'] = env[entry];
          envData.push(json);
          break;
        default:
          break;
      }
    }
    // Send static data ASAP but re-send below in case the client isn't ready.
    socket.emit('environment', JSON.stringify(envData));
    socket.emit('title', JSON.stringify({title: title, docs: docs}));
    socket.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));

    // When the client confirms it's connected and has listeners ready,
    // re-send the static data.
    socket.on('connected', () => {
      socket.emit('environment', JSON.stringify(envData));
      socket.emit('title', JSON.stringify({title: title, docs: docs}));
      socket.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));
    });

    /*
     * Support enabling/disabling profiling data
     */
    socket.on('enableprofiling', function() {
      profiling_enabled = true;
      monitoring.enable('profiling');
      // Braodcast the profiling change to keep all clients updated.
      io.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));
    });

    socket.on('disableprofiling', function() {
      monitoring.disable('profiling');
      profiling_enabled = false;
      // Braodcast the profiling change to keep all clients updated.
      io.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));
      // TODO - Emit an event to say profiling is on or off!
    });

    // Trigger a NodeReport then emit it via the socket that requested it
    socket.on('nodereport', function() {
      debug('on nodereport: possible? %j', !!nodereport);
      if (nodereport) {
        socket.emit('nodereport', {report: nodereport.getReport()});
      } else {
        socket.emit('nodereport', {error: 'node reporting not available'});
      }
    });

    // Trigger a heapdump then pass the location of the file generated back to the socket that requested it
    socket.on('heapdump', function() {
      appmetrics.writeSnapshot(function(err, filename) {
        var fullFileName = path.join(process.cwd(), filename);
        socket.emit('heapdump', {location: fullFileName, error: err});
      });
    });
  });

  /*
   * Broadcast monitoring data to connected clients when it arrives
   */
  monitoring.on('cpu', function(data) {
    latestCPUEvent = data;
    totalProcessCPULoad += data.process;
    totalSystemCPULoad += data.system;
    cpuLoadSamples++;
    latestCPUEvent.processMean = (totalProcessCPULoad / cpuLoadSamples);
    latestCPUEvent.systemMean = (totalSystemCPULoad / cpuLoadSamples);
  });

  monitoring.on('memory', function(data) {
    latestMemEvent = data;
  });

  monitoring.on('gc', function(data) {
    latestGCEvent = data;
    gcDurationTotal += data.duration;
    maxHeapUsed = Math.max(maxHeapUsed, data.used);
    latestGCEvent.timeSummary = (gcDurationTotal / (process.uptime() * 1000));
    latestGCEvent.usedHeapAfterGCMax = maxHeapUsed;
  });

  monitoring.on('profiling', function(data) {
    io.emit('profiling', JSON.stringify(data));
  });

  monitoring.on('loop', function(data) {
    latestLoopEvent = data;
  });

  monitoring.on('http', function(data) {
    if (!aggregateHttpEvent) {
      aggregateHttpEvent = {};
      aggregateHttpEvent.total = 1;
      aggregateHttpEvent.average = data.duration;
      aggregateHttpEvent.longest = data.duration;
      aggregateHttpEvent.time = data.time;
      aggregateHttpEvent.url = data.url;
    } else {
      aggregateHttpEvent.total = aggregateHttpEvent.total + 1;
      aggregateHttpEvent.average = (aggregateHttpEvent.average * (aggregateHttpEvent.total - 1) + data.duration) / aggregateHttpEvent.total;
      if (data.duration > aggregateHttpEvent.longest) {
        aggregateHttpEvent.longest = data.duration;
        aggregateHttpEvent.url = data.url;
      }
    }

    if (httpURLData.hasOwnProperty(data.url)) {
      var urlData = httpURLData[data.url];
      // Recalculate the average
      urlData.duration = (urlData.duration * urlData.hits + data.duration) / (urlData.hits + 1);
      urlData.hits = urlData.hits + 1;
      if (data.duration > urlData.longest) {
        urlData.longest = data.duration;
      }
    } else {
      httpURLData[data.url] = {duration: data.duration, hits: 1, longest: data.duration};
    }

  });

  monitoring.on('https', function(data) {
    if (!aggregateHttpsEvent) {
      aggregateHttpsEvent = {};
      aggregateHttpsEvent.total = 1;
      aggregateHttpsEvent.average = data.duration;
      aggregateHttpsEvent.longest = data.duration;
      aggregateHttpsEvent.time = data.time;
      aggregateHttpsEvent.url = data.url;
    } else {
      aggregateHttpsEvent.total = aggregateHttpsEvent.total + 1;
      aggregateHttpsEvent.average = (aggregateHttpsEvent.average * (aggregateHttpsEvent.total - 1) + data.duration) / aggregateHttpsEvent.total;
      if (data.duration > aggregateHttpsEvent.longest) {
        aggregateHttpsEvent.longest = data.duration;
        aggregateHttpsEvent.url = data.url;
      }
    }

    if (httpURLData.hasOwnProperty(data.url)) {
      var urlData = httpURLData[data.url];
      // Recalculate the average
      urlData.duration = (urlData.duration * urlData.hits + data.duration) / (urlData.hits + 1);
      urlData.hits = urlData.hits + 1;
      if (data.duration > urlData.longest) {
        urlData.longest = data.duration;
      }
    } else {
      httpURLData[data.url] = {duration: data.duration, hits: 1, longest: data.duration};
    }

  });

  monitoring.on('http-outbound', function(data) {
    if (!aggregateHttpOutboundEvent) {
      aggregateHttpOutboundEvent = {};
      aggregateHttpOutboundEvent.total = 1;
      aggregateHttpOutboundEvent.average = data.duration;
      aggregateHttpOutboundEvent.longest = data.duration;
      aggregateHttpOutboundEvent.time = data.time;
      aggregateHttpOutboundEvent.url = data.url;
    } else {
      aggregateHttpOutboundEvent.total = aggregateHttpOutboundEvent.total + 1;
      aggregateHttpOutboundEvent.average = (aggregateHttpOutboundEvent.average * (aggregateHttpOutboundEvent.total - 1) + data.duration) / aggregateHttpOutboundEvent.total;
      if (data.duration > aggregateHttpOutboundEvent.longest) {
        aggregateHttpOutboundEvent.longest = data.duration;
        aggregateHttpOutboundEvent.url = data.url;
      }
    }
  });

  monitoring.on('https-outbound', function(data) {
    if (!aggregateHttpsOutboundEvent) {
      aggregateHttpsOutboundEvent = {};
      aggregateHttpsOutboundEvent.total = 1;
      aggregateHttpsOutboundEvent.average = data.duration;
      aggregateHttpsOutboundEvent.longest = data.duration;
      aggregateHttpsOutboundEvent.time = data.time;
      aggregateHttpsOutboundEvent.url = data.url;
    } else {
      aggregateHttpsOutboundEvent.total = aggregateHttpsOutboundEvent.total + 1;
      aggregateHttpsOutboundEvent.average = (aggregateHttpsOutboundEvent.average * (aggregateHttpsOutboundEvent.total - 1) + data.duration) / aggregateHttpsOutboundEvent.total;
      if (data.duration > aggregateHttpsOutboundEvent.longest) {
        aggregateHttpsOutboundEvent.longest = data.duration;
        aggregateHttpsOutboundEvent.url = data.url;
      }
    }
  });

  monitoring.on('mongo', function(data) {
    addProbeEvent('MongoDB', data);
  });

  monitoring.on('express', function(data) {
    addProbeEvent('Express', data);
  });

  monitoring.on('socketio', function(data) {
    addProbeEvent('Socket.IO', data);
  });

  monitoring.on('redis', function(data) {
    addProbeEvent('Redis', data);
  });

  monitoring.on('mysql', function(data) {
    addProbeEvent('MySQL', data);
  });

  monitoring.on('postgres', function(data) {
    addProbeEvent('Postgres', data);
  });

  monitoring.on('riak', function(data) {
    addProbeEvent('Riak', data);
  });

  monitoring.on('leveldown', function(data) {
    addProbeEvent('Leveldown', data);
  });

  setInterval(emitData, emitInterval).unref();
  return server;
};

function addProbeEvent(probename, data) {
  var found = false;
  for (var i = 0; i < aggregateProbeEvents.length; i++) {
    if (aggregateProbeEvents[i].name === probename) {
      found = true;
      var total = aggregateProbeEvents[i].total + 1;
      aggregateProbeEvents[i].total = total;
      aggregateProbeEvents[i].duration = (aggregateProbeEvents[i].duration * (total - 1) + data.duration) / total;
    }
  }
  if (!found) {
    aggregateProbeEvents.push({name: probename, total: 1, duration: data.duration, time: data.time});
  }
}

function emitData() {
  if (latestCPUEvent) {
    io.emit('cpu', JSON.stringify(latestCPUEvent));
    latestCPUEvent = null;
  }
  if (latestMemEvent) {
    io.emit('memory', JSON.stringify(latestMemEvent));
    latestMemEvent = null;
  }
  if (latestLoopEvent) {
    io.emit('loop', JSON.stringify(latestLoopEvent));
    latestLoopEvent = null;
  }
  if (aggregateHttpEvent) {
    io.emit('http', JSON.stringify(aggregateHttpEvent));
    aggregateHttpEvent = null;
  }
  if (aggregateHttpsEvent) {
    io.emit('https', JSON.stringify(aggregateHttpsEvent));
    aggregateHttpsEvent = null;
  }
  if (latestGCEvent) {
    io.emit('gc', JSON.stringify(latestGCEvent));
    latestGCEvent = null;
  }
  if (aggregateHttpOutboundEvent) {
    io.emit('http-outbound', JSON.stringify(aggregateHttpOutboundEvent));
    aggregateHttpOutboundEvent = null;
  }
  if (aggregateHttpsOutboundEvent) {
    io.emit('https-outbound', JSON.stringify(aggregateHttpsOutboundEvent));
    aggregateHttpsOutboundEvent = null;
  }
  if (aggregateProbeEvents.length > 0) {
    io.emit('probe-events', JSON.stringify(aggregateProbeEvents));
    aggregateProbeEvents = [];
  }

  if (Object.keys(httpURLData).length > 0) {
    var result = [];
    for (var url in httpURLData) {
      if (httpURLData.hasOwnProperty(url)) {
        httpURLData[url];
        var json = {};
        json['url'] = url;
        json['averageResponseTime'] = httpURLData[url].duration;
        json['hits'] = httpURLData[url].hits;
        json['longestResponseTime'] = httpURLData[url].longest;
        result.push(json);
      }
    }
    io.emit('http-urls', JSON.stringify(result));
  }
}

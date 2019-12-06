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

const rest = require('./appmetrics-rest.js');


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

var middleware;

const defaultMiddleware = function(req, res, next) {
  return next();
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

  // set middleware and err handler
  middleware = options.middleware || defaultMiddleware;

  var url = options.url || '/appmetrics-dash';
  var title = options.title || 'Application Metrics for Node.js';
  var docs =
    options.docs ||
    'https://developer.ibm.com/node/application-metrics-node-js/';

  options.console = options.console || console;
  var log = options.console.log;
  var error = options.console.error;

  // appmetrics is a global singleton, allow the user's appmetrics to be
  // injected, only using our own if the user did not supply one.
  var appmetrics = options.appmetrics || require('appmetrics');
  // XXX(sam) We should let the user turn monitoring on or off! But we need
  // access to the monitor object to listen for events. Does monitor() actually
  // start appmetrics?
  // XXX(mattcolegate) yes - see appmetrics/index.js#L294
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
    }
  }
  var path = require('path');
  var directory = path.resolve(__dirname, '..', 'public');
  var site = express.static(directory);
  var server;

  if (!options.server) {
    // Create and use our own express server on the user-specified port/host.
    var port = options.port || 3001; // Set a default port if one is not supplied
    var host = options.host;
    var app = express();
    server = require('http').Server(app);
    // Specify a path, to not collide with user's socket.io.
    io = require('socket.io')(server, { path: url + '/socket.io' });

    app.use(middleware);

    // Start the API using the created app
    rest.startApi(app);

    app.use(url, site);
    server.listen(port, host, function() {
      var a = this.address();
      log('appmetrics-dash listening on %s:%s', a.address, a.port);
    });
  } else if (options.app) {
    // Use express APIs instead of patching http event handlers
    debug('mount the dashboard onto the provided app and server');
    console.assert(options.server); // no server handled in previous block
    server = options.server;

    debug('listen for socket.io at:', url + '/socket.io');
    io = require('socket.io')(server, { path: url + '/socket.io' });

    // Start the API using the provided app
    rest.startApi(options.app);

    // dash has its own middleware, so create a sub-app for it.
    debug('use our app at url:', url);
    const ours = require('express')();
    options.app.use(url, ours);

    ours.use('/', site);
    ours.use(siteNotFound);
    ours.use(siteError);
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
    io = require('socket.io')(server, { path: url + '/socket.io' });

    debug('patch new request listeners...');
    server.on('newListener', function(eventName, listener) {
      if (eventName !== 'request') return;
      if (listener.__dashboard_patched) return;
      process.nextTick(function() { patch(listener); });
    });
  }

  function patch(listener) {
    debug('patching %s', listener);
    server.removeListener('request', listener);
    var app = express();

    app.use(middleware);

    // Start the API using the created app
    rest.startApi(app);

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
    debug('site not found');
    res.statusCode = 404;
    return res.end();
  }

  function siteError(err, req, res, _next) {
    res.statusCode = err.statusCode || 500;
    debug('site error %d: %s', res.statusCode, err.message);
    return res.end(err.message);
  }

  /*
   * Publish the environment data to clients when they connect
   */
  io.on('connection', function(socket) {
    onIoConnection(socket, {
      monitoring,
      title,
      docs,
      nodereport,
      appmetrics,
      path,
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
    rest.updateCollections('cpu', data);
  });

  monitoring.on('memory', function(data) {
    latestMemEvent = data;
    rest.updateCollections('memory', data);
  });

  monitoring.on('gc', function(data) {
    latestGCEvent = data;
    gcDurationTotal += data.duration;
    maxHeapUsed = Math.max(maxHeapUsed, data.used);
    latestGCEvent.timeSummary = (gcDurationTotal / (process.uptime() * 1000));
    latestGCEvent.usedHeapAfterGCMax = maxHeapUsed;
    rest.updateCollections('gc', data);
  });

  monitoring.on('profiling', function(data) {
    io.emit('profiling', JSON.stringify(data));
  });

  monitoring.on('loop', function(data) {
    latestLoopEvent = data;
  });

  function initWebEvent(data) {
    return {
      total: 1,
      average: data.duration,
      longest: data.duration,
      time: data.time,
      url: data.url,
    };
  };

  function updateWebEvent(event, data) {
    return {
      total: event.total + 1,
      average: (event.average * (event.total - 1) + data.duration) / event.total,
      longest: (data.duration > event.longest) ? data.duration : event.longest,
      time: event.time,
      url: (data.duration > event.longest) ? data.url : event.url,
    };
  }

  function updateHttpURLData(data, protocolName) {
    var urlWithVerb = data.method + ' ' + data.url;
    if (httpURLData.hasOwnProperty(urlWithVerb)) {
      var urlData = httpURLData[urlWithVerb];
      // Recalculate the average
      urlData.duration = (urlData.duration * urlData.hits + data.duration) / (urlData.hits + 1);
      urlData.hits = urlData.hits + 1;
      if (data.duration > urlData.longest) {
        urlData.longest = data.duration;
      }
    } else {
      httpURLData[urlWithVerb] = {duration: data.duration, hits: 1, longest: data.duration};
    }
    rest.updateCollections(protocolName, data);
  }

  monitoring.on('http', function(data) {
    aggregateHttpEvent = (!aggregateHttpEvent) ? initWebEvent(data) : updateWebEvent(aggregateHttpEvent, data);
    updateHttpURLData(data, 'http');
  });

  monitoring.on('https', function(data) {
    aggregateHttpsEvent = (!aggregateHttpsEvent) ? initWebEvent(data) : updateWebEvent(aggregateHttpsEvent, data);
    updateHttpURLData(data, 'https');
  });

  monitoring.on('http-outbound', function(data) {
    aggregateHttpOutboundEvent = (!aggregateHttpOutboundEvent) ? initWebEvent(data) : updateWebEvent(aggregateHttpOutboundEvent, data);
  });

  monitoring.on('https-outbound', function(data) {
    aggregateHttpsOutboundEvent = (!aggregateHttpsOutboundEvent) ? initWebEvent(data) : updateWebEvent(aggregateHttpsOutboundEvent, data);
  });

  let probes = [
    {monitorName: 'mongo', eventName: 'MongoDB'},
    {monitorName: 'express', eventName: 'Express'},
    {monitorName: 'socketio', eventName: 'Socket.IO'},
    {monitorName: 'redis', eventName: 'Redis'},
    {monitorName: 'mysql', eventName: 'MySQL'},
    {monitorName: 'postgres', eventName: 'Postgres'},
    {monitorName: 'riak', eventName: 'Riak'},
    {monitorName: 'leveldown', eventName: 'Leveldown'},
  ];
  function monitor(probe) {
    monitoring.on(probe.monitorName, function(data) {
      addProbeEvent(probe.eventName, data);
    });
  };
  probes.forEach(monitor);

  setInterval(emitData, emitInterval).unref();
  return server;
};

function onIoConnection(socket, options) {
  var monitoring = options.monitoring;
  var title = options.title;
  var docs = options.docs;
  var nodereport = options.nodereport;
  var appmetrics = options.appmetrics;
  var path = options.path;
  var env = monitoring.getEnvironment();
  var envData = [];

  function pushDataToEnvArrayAsJSON(param, value) {
    if (value != null) {
      let json = {};
      json['Parameter'] = param;
      json['Value'] = value;
      envData.push(json);
    }
  };

  pushDataToEnvArrayAsJSON('Command Line', env['command.line']);
  pushDataToEnvArrayAsJSON('Hostname', env['environment.HOSTNAME']);
  pushDataToEnvArrayAsJSON('OS Architecture', env['os.arch']);
  pushDataToEnvArrayAsJSON('Number of Processors', env['number.of.processors']);

  function sendStaticData() {
    socket.emit('environment', JSON.stringify(envData));
    socket.emit('title', JSON.stringify({title: title, docs: docs}));
    socket.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));
  }

  // Send static data ASAP but re-send below in case the client isn't ready.
  sendStaticData();

  // When the client confirms it's connected and has listeners ready,
  // re-send the static data.
  socket.on('connected', () => {
    sendStaticData();
  });

  /*
   * Support enabling/disabling profiling data
   */
  function enableProfiling(boolflag) {
    profiling_enabled = boolflag;
    var mon_func = boolflag ? monitoring.enable : monitoring.disable;
    mon_func.call(monitoring, 'profiling');
    // Braodcast the profiling change to keep all clients updated.
    io.emit('status', JSON.stringify({profiling_enabled: profiling_enabled}));
    // TODO - Emit an event to say profiling is on or off!
  };
  socket.on('enableprofiling', () => enableProfiling(true));
  socket.on('disableprofiling', () => enableProfiling(false));

  // Trigger a NodeReport then emit it via the socket that requested it
  socket.on('nodereport', function() {
    debug('on nodereport: possible? %j', !!nodereport);
    socket.emit('nodereport', nodereport ? {report: nodereport.getReport()} : {error: 'node reporting not available'});
  });

  // Trigger a heapdump then pass the location of the file generated back to the socket that requested it
  socket.on('heapdump', function() {
    appmetrics.writeSnapshot(function(err, filename) {
      socket.emit('heapdump', {location: path.join(process.cwd(), filename), error: err});
    });
  });
}

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

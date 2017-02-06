/*******************************************************************************
 * Copyright 2015 IBM Corp.
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

const assert = require('assert');
const debug = require('debug')('appmetrics-dash');
const util = require('util');

var httpBuffer = [];
var httpOutboundBuffer = [];
var gcBuffer = [];
var probeEventsBuffer = [];
var io;

var save = {};

exports.attach = function(options) {
  if (save.Server) {
    // Already attached.
    return exports;
  }
  // Protect our options from modification.
  options = util._extend({}, options);

  const http = require('http');

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

  return exports;
};

// Start monitoring process and subscribe to the data.
exports.monitor = function(options) {
  // Protect our options from modification.
  options = util._extend({}, options);

  var url = options.url || '/appmetrics-dash';
  var user = options.uid || 'admin';
  var pass = options.admin || 'admin';
  var users = {};
  users[user] = pass;
  options.console = options.console || console;
  var log = options.console.log;

  // appmetrics is a global singleton, allow the user's appmetrics to be
  // injected, only using our own if the user did not supply one.
  var appmetrics = options.appmetrics || require('appmetrics');
  // XXX(sam) We should let the user turn monitoring on or off! But we need
  // access to the monitor object to listen for events. Does monitor() actually
  // start appmetrics?
  var monitoring = appmetrics.monitor();
  var express = require('express');
  var nodereport = require('nodereport/api');
  var path = require('path');

  var directory = path.resolve(__dirname, '..', 'public');
  var site = express.static(directory);
  var auth = require('express-basic-auth')({
    users: users,
    challenge: true,
  });
  var server;

  if (!options.server) {
    // Create and use our own express server on the user-specified port/host.
    assert('port' in options);
    var port = options.port;
    var host = options.host;
    var app = express();
    server = require('http').Server(app);
    // XXX(sam) specify a path, to not collide with user's socket.io. Not
    // changing now, it will need coordination with FE javascript.
    io = require('socket.io')(server);
    app.use(url, auth);
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
    io = require('socket.io')(server);
    debug('patch existing request listeners');
    server.listeners('request').forEach(patch);
    debug('patch new request listeners...');
    server.on('newListener', function(eventName, listener) {
      if (eventName !== 'request') return;
      process.nextTick(function() { patch(listener); });
    });
  };

  function patch(listener) {
    debug('patching %s', listener);
    server.removeListener('request', listener);
    var app = express();
    app.use(url, auth);
    app.use(url, site);
    app.use(url, siteNotFound);
    app.use(url, siteError);
    // If request not for the dashboard url, forward it back to the original
    // listener.
    app.use(function(req, res) {
      listener.call(server, req, res);
    });
    server.on('request', app);
  }

  function siteNotFound(req, res) {
    res.statusCode = 404;
    return res.end();
  }

  function siteError(err, req, res, next) {
    res.statusCode = 500;
    return res.end(err.message);
  }

  /*
   * Publish the environment data to clients when they connect
   */
  io.on('connection', function(socket) {
    var env = monitoring.getEnvironment();
    var result = [];
    var json;
    for (var entry in env) {
      switch (entry) {
        case 'command.line':
          json = {};
          json['Parameter'] = 'Command Line';
          json['Value'] = env[entry];
          result.push(json);
          break;
        case 'environment.HOSTNAME':
          json = {};
          json['Parameter'] = 'Hostname';
          json['Value'] = env[entry];
          result.push(json);
          break;
        case 'os.arch':
          json = {};
          json['Parameter'] = 'OS Architecture';
          json['Value'] = env[entry];
          result.push(json);
          break;
        case 'number.of.processors':
          json = {};
          json['Parameter'] = 'Number of Processors';
          json['Value'] = env[entry];
          result.push(json);
          break;
        default:
          break;
      }
    }
    socket.emit('environment', JSON.stringify(result));

    /*
     * Support enabling/disabling profiling data
     */
    socket.on('enableprofiling', function() {
      monitoring.enable('profiling');
    });

    socket.on('disableprofiling', function() {
      monitoring.disable('profiling');
    });

    // Trigger a NodeReport then emit it via the socket that requested it
    socket.on('nodereport', function() {
      socket.emit('nodereport', nodereport.getReport());
    });
  });

  /*
   * Broadcast monitoring data to connected clients when it arrives
   */
  monitoring.on('cpu', function(data) {
    io.emit('cpu', JSON.stringify(data));
  });

  monitoring.on('memory', function(data) {
    io.emit('memory', JSON.stringify(data));
  });

  monitoring.on('gc', function(data) {
    gcBuffer.push(data);
  });

  monitoring.on('profiling', function(data) {
    io.emit('profiling', JSON.stringify(data));
  });

  monitoring.on('eventloop', function(data) {
    io.emit('eventloop', JSON.stringify(data));
  });

  monitoring.on('http', function(data) {
    httpBuffer.push(data);
  });

  monitoring.on('http-outbound', function(data) {
    httpOutboundBuffer.push(data);
  });

  monitoring.on('mongo', function(data) {
    var json = {};
    json['name'] = 'MongoDB';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('express', function(data) {
    var json = {};
    json['name'] = 'Express';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('socketio', function(data) {
    var json = {};
    json['name'] = 'Socket.IO';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('redis', function(data) {
    var json = {};
    json['name'] = 'Redis';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('mysql', function(data) {
    var json = {};
    json['name'] = 'MySQL';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('postgres', function(data) {
    var json = {};
    json['name'] = 'Postgres';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('riak', function(data) {
    var json = {};
    json['name'] = 'Riak';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  monitoring.on('leveldown', function(data) {
    var json = {};
    json['name'] = 'LevelDB';
    json['time'] = data['time'];
    json['duration'] = data['duration'];
    probeEventsBuffer.push(json);
  });

  setInterval(emitData, 2000).unref();

  return server;
};

function emitData() {
  if (httpBuffer.length > 0) {
    io.emit('http', JSON.stringify(httpBuffer));
    httpBuffer.length = 0;
  }
  if (gcBuffer.length > 0) {
    io.emit('gc', JSON.stringify(gcBuffer));
    gcBuffer.length = 0;
  }
  if (httpOutboundBuffer.length > 0) {
    io.emit('http-outbound', JSON.stringify(httpOutboundBuffer));
    httpOutboundBuffer.length = 0;
  }
  if (probeEventsBuffer.length > 0) {
    io.emit('probe-events', JSON.stringify(probeEventsBuffer));
    probeEventsBuffer.length = 0;
  }
}


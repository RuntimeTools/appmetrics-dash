/*eslint-env node*/
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

module.exports.monitor = function(opts) {
  /*
   * Start monitoring process and subscribe to the data
   */
  var appmetrics = require('appmetrics');
  var monitoring = appmetrics.monitor();
  var fs = require('fs');
  var path=require('path');
  var cfenv = require('cfenv');
  var appEnv = cfenv.getAppEnv();
  var nodereport = require('nodereport');

  /*
   * Setup default options
   */
  var options = opts || {};
  var port = options.port || appEnv.port;
  var url  = options.url || '/appmetricsdash'; 
  var uid  = options.uid || 'admin';  // id variable
  var pass = options.admin || 'admin'; // password variable
  var io;
  var directory= path.dirname(__dirname);

  if (typeof(options.server) === 'undefined'){
    var express = require('express');
    var app = require('express')();
    var server = require('http').Server(app);
    io = require('socket.io')(server);
    app.use(url, express.static(directory + '/public')); 
    console.log("port is " + port);
    server.listen(port);
  } else {// else use the server that has been defined in the application
    var server = options.server;
    io = require('socket.io')(server);
    server.listeners('request').forEach(function(listener){
      server.removeListener('request', listener);
      server.on('request', function(req, response){
        if (req.url === url) {
          if (authenticate(req, response) === true){
            var file = directory + '/public/index.html';
            var stat = fs.statSync(file);
            var stream = fs.createReadStream(file);
            response.writeHead(200, {
              'Content-Type': 'text/html; charset=UTF-8',
              'Content-Length': stat.size
            });

            response.on('error', function(err) {
              stream.end();
            });
            stream.pipe(response);
          }
        } else {
          var filename = directory + '/public' + req.url;
          if (!fs.existsSync(filename)) {
            listener(req,response);
            return
          }
          var stat = fs.statSync(filename);
          if (stat.isFile()) {
            var stream = fs.createReadStream(filename);
            switch (filename.extname) {
              case '.html':
                response.writeHead(200, {
                  'Content-Type': 'text/html; charset=UTF-8',
                  'Content-Length': stat.size
                });
                break;
              case '.js':
                response.writeHead(200, {
                  'Content-Type': 'text/javascript; charset=UTF-8',
                  'Content-Length': stat.size
                });
                break;
              case '.css':
                response.writeHead(200, {
                  'Content-Type': 'text/css; charset=UTF-8',
                  'Content-Length': stat.size
                });
                break;
            }

            response.on('error', function(err) {
              stream.end();
            });
            stream.pipe(response);
          } 
        }
      })
    })
  };

  var authenticate = function (req, res) {
    /*
     * Add basic user id / password authentication
     */
    var auth;
    if (req.headers.authorization) {
      auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
    }
    if (!auth || auth[0] !== uid || auth[1] !== pass) {
      res.statusCode = 401;
      res.setHeader('WWW-Authenticate', 'Basic realm=Node Application Metrics Dashboard');
      res.end('Unauthorized');
      return false;
    }
    return true;
  };

  /*
   * Publish the environment data to clients when they connect
   */

  io.on('connection', function(socket) {
    env = monitoring.getEnvironment();
    var result = [];
    for (var entry in env) {
      switch (entry) {
        case "command.line":
          var json = {};
          json["Parameter"]="Command Line";
          json["Value"]=env[entry];
          result.push(json);

          break;
        case "environment.HOSTNAME":
          var json = {};
          json["Parameter"]="Hostname";
          json["Value"]=env[entry];
          result.push(json);
        case "os.arch":
          var json = {};
          json["Parameter"]="OS Architecture";
          json["Value"]=env[entry];
          result.push(json);
          break;
        case "number.of.processors":
          var json = {};
          json["Parameter"]="Number of Processors";
          json["Value"]=env[entry];
          result.push(json);
          break;
        default:
          break;
      }
    }    
    socket.emit('environment', JSON.stringify(result));
    /*
     * Support enabling/diabling profiling data
     */
    socket.on('enableprofiling', function(req) {
      monitoring.enable('profiling');
    });

    socket.on('disableprofiling', function(req) {
      monitoring.disable('profiling');
    });

    socket.on('nodereport', function(req) {
      // Trigger a NodeReport then emit it via the socket that requested it
      socket.emit('nodereport', nodereport.getReport());
    });

  });

  /*
   * Broadcast monitoring data to connected clients when it arrives
   */
  monitoring.on('cpu', function (data) {
    io.emit('cpu', JSON.stringify(data));
  });

  monitoring.on('memory', function (data) {
    io.emit('memory', JSON.stringify(data));
  });

  monitoring.on('gc', function (data) {
    io.emit('gc', JSON.stringify(data));
  });

  monitoring.on('profiling', function (data) {
    io.emit('profiling', JSON.stringify(data));
  });

  monitoring.on('eventloop', function (data) {
    io.emit('eventloop', JSON.stringify(data));
  });

  monitoring.on('http', function (data) {
    io.emit('http', JSON.stringify(data));
  });

  monitoring.on('http-outbound', function (data) {
    io.emit('http-outbound', JSON.stringify(data));
  });
}

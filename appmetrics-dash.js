/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var appmetrics = require('appmetrics');
var monitoring = appmetrics.monitor();

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

var nodereport = require('nodereport');

var http = require('http');
// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = require('express')();
var server = http.Server(app);
var io = require('socket.io')(server);
var appEnv = cfenv.getAppEnv()
server.listen(appEnv.port);
console.log("port is " + appEnv.port);

var options = {
    host: 'www.google.com',
    path: '/index.html'
  };

app.use(express.static(__dirname + '/public'));
//app.get('/', function (req, res) {
//  res.sendfile(__dirname + '/index.html');
//});

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
    // Trigger a Node Report then return it to dash
    try {
        var nodeReportFileName = nodereport.triggerReport();
        var fs = require('fs');
        fs.readFile(nodeReportFileName, "utf-8", function (error, data) {
            if(error) {
                io.emit('nodereport', error);
            } else {
                io.emit('nodereport', data);
            }
        });
        } catch (err) {
        // Catch any errors thrown by triggerReport()
            io.emit('nodereport', err);
        }
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

monitoring.on('http', function (data) {
  io.emit('http', JSON.stringify(data));
});


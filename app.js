/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

var appmetrics = require('appmetrics');
var monitoring = appmetrics.monitor();

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');


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
  socket.emit('environment', JSON.stringify(monitoring.getEnvironment()));
  /*
   * Support enabling/diabling profiling data
   */
  socket.on('enableprofiling', function(req) {
    monitoring.enable('profiling');
  });
  
  socket.on('disableprofiling', function(req) {
    monitoring.disable('profiling');
  });
  socket.on('cpuRequest', function(req) {
    socket.emit('environment', JSON.stringify(monitoring.getEnvironment()));
  });
  socket.on('httpRequest', function(req) {
    socket.emit('environment', JSON.stringify(monitoring.getEnvironment()));
  });
  socket.on('memRequest', function(req) {
    socket.emit('environment', JSON.stringify(monitoring.getEnvironment()));
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


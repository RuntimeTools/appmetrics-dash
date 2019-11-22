'use strict';
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

require('../../..').monitor({server, app});

app.use('/', user());

function user() {
  var app = require('express')();
  var io = require('socket.io')(server);

  app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
  });

  io.on('connection', function(socket){
    socket.on('chat message', function(msg){
      io.emit('chat message', msg);
    });
  });
  return app;
}

app.get('*', (req, res) => {
  res.status(404).send('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`App started on PORT ${PORT}`);
});

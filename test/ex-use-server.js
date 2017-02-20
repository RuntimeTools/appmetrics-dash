'use strict';

const port = 'PORT' in process.env ? process.env.PORT : 3000;
const server = require('http').createServer();

server.listen(port, 'localhost', function() {
  const a = this.address();
  console.log('listening on %s:%s', a.address, a.port);
});

server.on('request', function(req, res) {
  res.write('This is the app!');
  res.end();
});

require('../').monitor({
  appmetrics: require('appmetrics'),
  server: server,
});

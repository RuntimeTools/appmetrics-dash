/*******************************************************************************
 * Copyright 2017 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *******************************************************************************/
'use strict';

const options = {
  cert: require('fs').readFileSync(__dirname + '/ec-cert.pem'),
  key: require('fs').readFileSync(__dirname + '/ec-key.pem'),
};
const port = 'PORT' in process.env ? process.env.PORT : 3000;
const server = process.env.HTTPS ?
  require('https').createServer(options) :
  require('http').createServer();

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

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

// Test framework.
const debug = require('debug')('appmetrics-dash:test');
const request = require('request');
const tap = require('tap');
const util = require('util');

// Setup appmetrics and start app somewhat as a supervisor would.
const appmetrics = require('appmetrics');
appmetrics.start();
require('../').attach({appmetrics: appmetrics});

// Simple https app
const options = {
  cert: require('fs').readFileSync(__dirname + '/ec-cert.pem'),
  key: require('fs').readFileSync(__dirname + '/ec-key.pem'),
};
const server = require('https').createServer(options);

server.listen(0, 'localhost', function() {
  const a = this.address();
  console.log('listening on %s:%s', a.address, a.port);
});

server.on('request', function(req, res) {
  res.write('This is the app!');
  res.end();
});

let base;

tap.test('start', function(t) {
  server.on('listening', function() {
    const port = this.address().port;
    let addr = this.address().address;
    if (addr === '0.0.0.0')
      addr = '127.0.0.1';
    if (addr === '::')
      addr = '[::1]';
    base = util.format('https://%s:%s', addr, port);
    t.pass('listened');
    t.end();
  });
});

tap.test('dashboard available', function(t) {
  const req = {
    url: base + '/appmetrics-dash',
    rejectUnauthorized: false,
  };
  debug('request %j', req);
  request(req, function(err, resp, body) {
    t.ifError(err);
    t.similar(body, /DOCTYPE html/);
    t.end();
  });
});

tap.test('stop', function(t) {
  server.close(t.end);
});

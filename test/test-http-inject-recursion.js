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

// Simple http app that triggered .use() recursion
const server = require('http').createServer();

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
    base = util.format('http://%s:%s', addr, port);
    t.pass('listened');
    t.end();
  });
});

tap.test('dashboard available', function(t) {
  const options = {
    url: base + '/appmetrics-dash',
  };
  debug('request %j', options);
  request(options, function(err, resp, body) {
    t.ifError(err);
    t.similar(body, /DOCTYPE html/);
    t.end();
  });
});

tap.test('stop', function(t) {
  server.close(t.end);
});

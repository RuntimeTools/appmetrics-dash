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
const request = require('request');
const tap = require('tap');
const util = require('util');

const appmetrics = require('appmetrics');
appmetrics.start();

tap.test('runs dashboard on ephemeral port', function(t) {
  var server = require('../').monitor({
    appmetrics: appmetrics,
    port: 0,
    host: '127.0.0.1',
    console: {
      log: function() { /* ignore */ },
      error: function() { /* ignore */ },
    },
  });

  server.on('listening', function() {
    const a = this.address();
    const base = util.format('http://%s:%s', a.address, a.port);
    const options = {
      url: base + '/appmetrics-dash',
    };
    t.equal(a.address, '127.0.0.1');
    t.comment(util.inspect(options));
    request(options, function(err, resp, body) {
      t.ifError(err);
      t.equal(resp.statusCode, 200);
      t.similar(body, /DOCTYPE html/);
      server.close(t.end);
    });
  });
});

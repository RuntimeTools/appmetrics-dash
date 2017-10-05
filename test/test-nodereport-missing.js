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

const appmetrics = require('appmetrics');
const io = require('socket.io-client');
const tap = require('tap');
const util = require('util');

tap.test('missing nodereport handled gracefully', function(t) {
  var server = require('../').monitor({
    appmetrics: appmetrics,
    nodereport: null,
    port: 0,
    host: '127.0.0.1',
    console: {
      log: function() { /* ignore */ },
      error: function() { /* ignore */ },
    },
  });

  server.on('listening', function() {
    const a = this.address();
    const url = util.format('ws://%s:%s', a.address, a.port);
    const ws = io.connect(url, {
      transport: ['websocket'],
    });
    ws.on('connect', function() {
      ws.emit('nodereport');
      ws.once('nodereport', check);
    });

    function check(msg) {
      t.equal(msg.error, 'node reporting not available');
      close();
    }

    function close() {
      ws.close();
      server.close(t.end);
    }
  });
});

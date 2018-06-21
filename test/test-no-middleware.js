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

var dash = require('../');

dash.attach(
  // not setting any middleware
);

var http = require('http');

const port = 3000;

const requestHandler = (request, response) => {
  response.end('Hello');
};

const server = http.createServer(requestHandler);

server.listen(port, err => {
  if (err) {
    return console.log('An error occurred', err);
  }
  console.log(`Server is listening on ${port}`);
});

tap.test('test with no middleware', function(t) {
  request('http://localhost:3000/appmetrics-dash', function(
    err,
    res
  ) {
    if (err) {
      throw err;
    }
    if (res.statusCode >= 400) {
      throw new Error('expected status code < 400. but got > 400');
    }
    t.pass();
    t.end();
  });
});

tap.test('stop', function(t) {
  server.close(t.end);
});

/*******************************************************************************
 * Copyright 2018 IBM Corp.
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
const debug = require('debug')('appmetrics-rest:test');
const request = require('request');
const tap = require('tap');
const util = require('util');

const response = {
  id: 0,
  time: {
    data: {
      start: /[0-9999999999999]/,
      end: /[0-9999999999999]/,
    },
    units: {
      start: 'UNIX time',
      end: 'UNIX time',
    }
  },
  cpu: {
    data: {
      systemMean: 0,
      systemPeak: 0,
      processMean: 0,
      processPeak: 0
    },
    units: {
      systemMean: 'decimal fraction',
      systemPeak: 'decimal fraction',
      processMean: 'decimal fraction',
      processPeak: 'decimal fraction'
    }
  },
  gc: {
    data: {
      gcTime: 0
    },
    units: {
      gcTime: 'decimal fraction'
    }
  },
  memory: {
    data: {
      usedHeapAfterGCPeak: 0,
      usedNativePeak: 0
    },
    units: {
      usedHeapAfterGCPeak: 'bytes',
      usedNativePeak: 'bytes'
    }
  },
  httpUrls: []
};

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

// Test for empty collections object
tap.test('GET collections', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections',
    method: 'GET'
  };
  debug('request %j', options);
  request(options, function(err, res, body) {
    t.ifError(err);
    t.equal(body, '{"collectionUris":[]}');
    t.end();
  });
});

// Test for collection creation
tap.test('POST collections', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections',
    method: 'POST'
  };
  debug('request %j', options);
  request(options, function(err, res, body) {
    t.ifError(err);
    t.equal(res.statusCode, 201);
    t.equal(body, '{"uri":"collections/0"}');
    t.end();
  });
});

// Test to check a GET request on a given collection
tap.test('GET single collection', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections/0',
    method: 'GET'
  };
  debug('request %j', options);
  request(options, function(err, res, body) {
    t.ifError(err);
    let expectedResponse = response;
    let json = JSON.parse(body);
    t.similar(json, expectedResponse);
    t.equal(json.id, 0);
    t.equal(res.statusCode, 200);
    t.end();
  });
});

// Test to make a PUT request on a given collection
tap.test('PUT collection', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections/0',
    method: 'PUT'
  };
  debug('request %j', options);
  request(options, function(err, res) {
    t.ifError(err);
    t.equal(res.statusCode, 204);
    t.end();
  });
});

// Test to check the list of collections after another collection has been added
tap.test('GET collections (more than one)', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections',
    method: 'GET'
  };
  // Create another collection
  request({url: options.url, method: 'POST' }, function(err) {
    if (err) {
      console.err('Error creating another collection');
    }
    t.ifError(err);
  });
  debug('request %j', options);
  request(options, function(err, res, body) {
    t.ifError(err);
    let expectedResponse = '{"collectionUris":["collections/0","collections/1"]}';
    t.equal(body, expectedResponse);
    t.equal(res.statusCode, 200);
    t.end();
  });
});

// Test to DELETE a given collection
tap.test('DELETE collection', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections/0',
    method: 'DELETE'
  };
  debug('request %j', options);
  request(options, function(err, res) {
    t.ifError(err);
    t.equal(res.statusCode, 204);
    t.end();
  });
});

// Test to attempt to retrieve a given collection
tap.test('GET deleted collection', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections/0',
    method: 'GET'
  };
  debug('request %j', options);
  request(options, function(err, res) {
    t.ifError(err);
    t.equal(res.statusCode, 404);
    t.end();
  });
});

// Test to attempt to delete a given collection that doesn't exist
tap.test('DELETE deleted collection', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections/0',
    method: 'DELETE'
  };
  debug('request %j', options);
  request(options, function(err, res) {
    t.ifError(err);
    t.equal(res.statusCode, 404);
    t.end();
  });
});

// Test to GET all collections now that the first has been deleted
tap.test('GET collections', function(t) {
  const options = {
    url: base + '/appmetrics/api/v1/collections',
    method: 'GET'
  };
  debug('request %j', options);
  request(options, function(err, res, body) {
    t.ifError(err);
    let expectedResponse = '{"collectionUris":["collections/1"]}';
    t.equal(body, expectedResponse);
    t.equal(res.statusCode, 200);
    t.end();
  });
});

tap.test('stop', function(t) {
  server.close(t.end);
});

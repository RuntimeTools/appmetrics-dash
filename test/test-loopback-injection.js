'use strict';

// Test framework.
const request = require('request');
const tap = require('tap');
const util = require('util');

// Setup appmetrics and start app somewhat as a supervisor would.
const appmetrics = require('appmetrics');
appmetrics.start();
require('../').attach({appmetrics: appmetrics});

const app = require('./apps/lb-3');
const server = app.start();
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

tap.test('loopack api available', function(t) {
  const url = base + '/api/Messages/greet';
  request(url, function(err, resp, body) {
    t.ifError(err);
    t.equal(body, '{"greeting":"Sender says hello to receiver"}');
    t.end();
  });
});

tap.test('dashboard available', function(t) {
  const options = {
    url: base + '/appmetrics-dash',
  };
  request(options, function(err, resp, body) {
    t.ifError(err);
    t.similar(body, /DOCTYPE html/);
    t.end();
  });
});

tap.test('stop', function(t) {
  server.close(t.end);
});

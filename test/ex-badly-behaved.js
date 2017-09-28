
/*******************************************************************************
* Copyright 2017 IBM Corp.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not
* use this file except in compliance with the License. You may obtain a copy of
* the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations under
* the License.
******************************************************************************/

'use strict';

require('../').monitor({
  port: 'PORT' in process.env ? process.env.PORT : 3000,
  host: 'localhost',
  appmetrics: require('appmetrics'),
});

setInterval(function() {
  if (Math.random() < 0.9) return;

  var start = Date.now();
  while ((Date.now() - start) < (Math.random() * 100))
    ;
}, 1000);

var waiting = 0;

function want() {
  // randomly choose how much load
  return Math.random() *
    (3 * parseInt(process.env.UV_THREADPOOL_SIZE || 4, 10));
}

function load() {
  var w = want();
  while (waiting < w) {
    waiting++;
    require('crypto').pbkdf2('pass', 'salt', 102400, 20, 'sha512', function() {
      waiting--;
      setImmediate(load);
    });
  }
}

load();

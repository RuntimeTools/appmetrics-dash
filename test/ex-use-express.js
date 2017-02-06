'use strict';

require('../').monitor({
  port: 'PORT' in process.env ? process.env.PORT : 3000,
  host: 'localhost',
  appmetrics: require('appmetrics'),
});

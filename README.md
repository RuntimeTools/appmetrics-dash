# appmetrics-dash

A dashboard to visualize the performance of your Node.js application. The dashboard
uses "[Node Application Metrics][1]" to monitor the application. 

## dash = require('appmetrics-dash').monitor()

This will launch the dashboard and start monitoring your application. When
no options are specified, an http server will be created and listen on port 3001.
The dashboard will be available at /appmetrics-dash

## dash.monitor(options)

* options.url {String} Path to serve dashboard from. Optional, defaults to
  `'/appmetrics-dash'`.
* options.console {Object} Some messages are printed to the console using
  `console.log()` and `console.error()`. Optional, defaults to the global
  `console` object.
* options.server {Object} An instance of a node `http` server to serve the
  dashboard from. Optional, default is to create a server (see `port` and
  `host`).
* options.port {String|Number} Port to listen on if creating a server. Optional,
  unused if `server` option is used.
* options.host {String} Host to listen on if creating a server. Optional,
  unused if `server` option is used.
* options.appmetrics {Object} An instance of `require('appmetrics')` can be
  injected if the application wants to use appmetrics, since it is a singleton
  module and only one can be present in an application. Optional, defaults to
  the appmetrics dependency of this module.
* options.node-report {Object} An instance of `require('node-report')` can be
  injected if the application wants to use node-report, since it is a singleton
  module and only one can be present in an application. Optional, defaults to
  the node-report dependency of this module.
* options.title {String} Title for the dashboard.
* options.docs {String} URL link to accompanying documentation.

## dash.attach(options)

* options {Object} Options are the same as for `dash.monitor()`.

Auto-attach to all `http` servers, calling `dash.monitor(options)` for every
server created.

### License
The Node Application Metrics Dashboard is licensed using an Apache v2.0 License.


[1]:https://developer.ibm.com/open/node-application-metrics/


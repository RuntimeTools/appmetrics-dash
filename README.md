# appmetrics-dash

appmetrics-dash provides a very easy to use, web based, dashboard to show the performance metrics of your running Node.js application.  

The data available on the dashboard is as follows:
* HTTP Incoming Requests
* HTTP Throughput
* Average Reponse Times (top 5)
* CPU
* Memory
* Heap
* Event loop Latency
* Environment
* Other Requests
* HTTP Outbound Requests

As well as displaying data, it also provides the ability to generate both [Node Report][2] and Heap Snapshots directly from the dashboard.  The Node Report will display in a new tab in the browser whilst the Heap Snapshot will be written to disk for loading into the Chrome DevTools for analysis.

The dashboard uses "[Node Application Metrics][1]" to monitor the application. 

## dash = require('appmetrics-dash').monitor()

This will launch the dashboard and start monitoring your application. When
no options are specified, an http server will be created and listen on port 3001.
The dashboard will be available at /appmetrics-dash

Simple example using the express framework

```
// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

var dash = require('appmetrics-dash').monitor();

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
var server = app.listen(appEnv.port, '0.0.0.0', function() {
	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
```

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
[2]:https://www.npmjs.com/package/node-report/


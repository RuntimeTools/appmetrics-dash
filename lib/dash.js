/*******************************************************************************
 * Copyright 2015 IBM Corp.
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
 
module.exports.start = function(opts) {
	/*
	 * Start monitoring process and subscribe to the data
	 */
	var appmetrics = require('appmetrics');
	var monitoring = appmetrics.monitor();
	var fs = require('fs');
	var p=require('path');
	/*
	 * Setup default options
	 */
	var options = opts || {};
	var port = options.port || 3000;
	var url  = options.url || '/admin'; //need to add on end of server page to access the html displayed information
	var uid  = options.uid || 'admin';  //id variable
	var pass = options.admin || 'admin'; //password variable
	
	var server;
	var io;
	var directory= p.dirname(__dirname);
	//conditional statements to check whether the application already has a server created.
	//if no server detected
	
	if (typeof(options.server) === 'undefined'){
		console.log('Starting Express');
		var app = require('express')();
		server = require('http').Server(app);
		io = require('socket.io')(server);
		
		app.get(url, function (req, res) {
			console.log('/admin');
			if (authenticate(req, res) === true) {
				res.sendFile(directory + '/html/client.html');
			}

		});
		server.listen(port);
		
	} else {//else use the server that has been defined in the application
		server = options.server;
		io = require('socket.io')(server);
		server.listeners('request').forEach(function(listener){
			server.removeListener('request', listener);
			server.on('request', function(req, res){
				if (req.url === url) {
					if (authenticate(req, res) === true){
						var file = directory + '/html/client.html';
						var stat = fs.statSync(file);
						var stream = fs.createReadStream(file);
						res.writeHead(200, {
							'Content-Type': 'text/html; charset=UTF-8',
							'Content-Length': stat.size
						});
					
						res.on('error', function(err) {
							stream.end();
						});
						stream.pipe(res);
					}
				} else {
					listener(req,res);
				}
			});
		});
	}
	
	var authenticate = function (req, res) {
		/*
		 * Add basic user id / password authentication
		 */
		var auth;
		if (req.headers.authorization) {
			auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':');
		}
		if (!auth || auth[0] !== uid || auth[1] !== pass) {
			res.statusCode = 401;
			res.setHeader('WWW-Authenticate', 'Basic realm=Node Application Metrics Dashboard');
			res.end('Unauthorized');
			return false;
		}
		return true;
	};
	
	/*
	 * Publish the environment data to clients when they connect
	 */
	io.on('connection', function(socket) {
		socket.emit('environment', JSON.stringify(monitoring.getEnvironment()));
		
		/*
		 * Support enabling/diabling profiling data
		 */
		socket.on('enableprofiling', function(req) {
			monitoring.enable('profiling');
		});
		
		socket.on('disableprofiling', function(req) {
			monitoring.disable('profiling');
		});
		
	});

	/*
	 * Broadcast monitoring data to connected clients when it arrives
	 */
	monitoring.on('cpu', function (data) {
		io.emit('cpu', JSON.stringify(data));
	});

	monitoring.on('memory', function (data) {
		io.emit('memory', JSON.stringify(data));
	});

	monitoring.on('gc', function (data) {
		io.emit('gc', JSON.stringify(data));
	});

	monitoring.on('profiling', function (data) {
		io.emit('profiling', JSON.stringify(data));
	});

};

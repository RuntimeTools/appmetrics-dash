/*******************************************************************************
 * Copyright 2018 IBM Corp.
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

let collections = [];
const Collection = require('./classes/collections.js');

/**
 * Function to set up all the API urls. Called after the 'app' express server is created
 */
module.exports.startApi = function startApi(app) {
  /**
   * Server API
   * GET      /appmetrics/api/v1/collections         - get an array of all collections available
   * GET      /appmetrics/api/v1/collections/:id     - returns a given collection
   * PUT      /appmetrics/api/v1/collections/:id     - zero all values in a collection, returns the collection before resetting the values
   * DELETE   /appmetrics/api/v1/collections/:id     - delete a single collection, returns the collection before state before deletion
   * POST     /appmetrics/api/v1/collections         - creates a new collection and returns it
   */

  app.get('/appmetrics/api/v1/collections', function(req, res) {
    try {
      let json = { collectionUris: [] };
      for (var i = 0; i < collections.length; i++) {
        let string = 'collections/' + collections[i].collection.id;
        json.collectionUris.push(string);
      }
      res.status(200);
      res.json(json);
    } catch (err) {
      res.status(400);
      res.send('Bad Request: ' + err);
    }
  });

  app.get('/appmetrics/api/v1/collections/:id', function(req, res) {
    getCollection(req, res, function(i) {
      res.status(200);
      res.json(collections[i].collection);
    });
  });

  app.put('/appmetrics/api/v1/collections/:id', function(req, res) {
    getCollection(req, res, function(i) {
      collections[i].reset();
      res.status(204).end();
    });
  });

  app.delete('/appmetrics/api/v1/collections/:id', function(req, res) {
    getCollection(req, res, function(i) {
      collections.splice(i, 1);
      res.status(204).end();
    });
  });

  app.post('/appmetrics/api/v1/collections', function(req, res) {
    try {
      let col = new Collection();
      collections.push(col);
      res.status(201);
      let colUrl = 'collections/' + col.collection.id;
      res.header('Location', colUrl);
      let json = {};
      json.uri = colUrl;
      res.json(json);
    } catch (err) {
      res.status(400);
      res.send('Unable to create new collection: ' + err);
    }
  });
};

/**
 * Function to send a collection to the user using the API Will either return a
 * 200 code if successful or a 400 if not
 *
 * @param req,
 *            the request from the API call
 * @param res,
 *            the response for the API call
 * @param cb,
 *            a callback function, called if the API call is successful
 */
function getCollection(req, res, cb) {
  let id = req.params.id;
  let index = -1;
  // Don't assume that the list will match up to ids
  for (var i = 0; i < collections.length; i++) {
    if (collections[i].collection.id == id) {
      index = i;
    }
  }
  if (index != -1) {
    try {
      let col = collections[index].collection;
      col.time.data.end = new Date().getTime();
      if (cb) {
        cb(index);
      }
    } catch (err) {
      res.status(204);
      res.send('Requested collection cannot be accessed');
    }
  } else {
    res.status(404).end();
  }
}

module.exports.updateCollections = function updateCollections(type, data) {
  for (var i = 0; i < collections.length; i++) {
    switch (type) {
      case 'cpu':
        collections[i].cpu(data);
        break;
      case 'memory':
        collections[i].memory(data);
        break;
      case 'gc':
        collections[i].gc(data);
        break;
      case 'http':
      case 'https':
        collections[i].http(data);
        break;
      default:
        break;
    }
  }
};

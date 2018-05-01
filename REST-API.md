# Node Application Metrics REST API


The REST API enables the collection of metrics from the running Node.js application. The API context root will be the server's default endpoint plus /appmetrics eg.
`http://localhost:3001/appmetrics/`

## Usage
Metrics are accumulated in a **collection**.
The start time of the metrics accumulation is from either creation of the collection
`POST <context_root>/api/v1/collections`
or from the time of a clear request
`PUT <context_root>/api/v1/collections/{id}`.


1. Create a new metrics collections. Metrics are recorded from collection creation time.
  - `POST <context_root>/api/v1/collections`
  - returned URI `collections/3`
2. Retrieve the metrics from the collection at required interval.
  - `GET <context_root>/api/v1/collections/3`
  - Process the returned JSON format metrics.
  - Optionally clear the metrics from the collection.<br>
  `PUT <context_root>/api/v1/collections/3`
3. Delete the collection.
  - `DELETE <context_root>/api/v1/collections/3`



## API reference

* [List current metrics collections](#list_collections)
* [Create a new metrics collection](#create_collection)
* [Retrieve metrics from a collection](#retrieve_collection)
* [Clear metrics from collection](#clear_collection)
* [Delete a metrics collection](#delete_collection)


### <a name="list_collections"></a>List metrics collections

Returns a list of the current metrics collections URIs.

* **URL**

  `/api/v1/collections`

* **Method**

  `GET`


* **URL Params**

  None

* **Data Params**

  None

* **Success Responses**

  * **Code:** `200 (OK)`
  * **Content:** The uris of existing **collections**.
  Example:
  ```JSON
  {
    "collectionUris": ["collections/0",
  "collections/1"]
  }
  ```

* **Error Responses**

  * na

### <a name="create_collection"></a>Create metrics collection

Creates a new metrics collection. The collection uri is returned in the Location header.

A maximum of 10 collections are allowed at any one time. Return code 400 indicates too many collections.

* **URL**

  `/api/v1/collections`

* **Method**

  `POST`

* **URL Params**

  None

* **Data Params**

  None

* **Success Responses**

  * **Code:** `201 (CREATED)`
  * **Content:** The uri of the created **collection**.
  Example:
  ```JSON
  {"uri":"collections/1"}
  ```

* **Error Responses**

  * **Code:** `400 (BAD REQUEST)`
  * **Content** none


### <a name="retrieve_collection"></a>Retrieve metrics collection

Returns the metrics from the specified collection.

* **URL**

  `/api/v1/collections/{id}`

* **Method**

  `GET`

* **URL Params**

  `Required: id=[integer]`

* **Data Params**

  None

* **Success Responses**

  * **Code:** `200 (OK)`
  * **Content:** JSON representation of the metrics in the **collection**.
  Example:
  ```JSON
  {
    "id": 0,
    "startTime": 1517491521423,
    "endTime": 1517491786220,
    "duration": 264797,
    "cpu": {
      "systemMean": 0.05717756509017522,
      "systemPeak": 0.3007518796992481,
      "processMean": 0.003432652505553302,
      "processPeak": 0.18843252600694052
    },
    "gc": {
      "gcTime": 2.269366316909319E-4
    },
    "memory": {
      "usedHeapAfterGCPeak": 59146992,
      "usedNativePeak": 119662312
    },
    "httpUrls": [
      {"url": "http://localhost:9080/myApplication/endpoint1",
        "hits": 3,
        "averageResponseTime": 4.0,
        "longestResponseTime": 4
      },
      {"url": "http://localhost:9080/myApplication/endpoint2",
        "hits": 7,
        "averageResponseTime": 53.678,
        "longestResponseTime": 232
      }
    ]
  }
  ```

* **Error Responses**

  * **Code:** `404 (NOT_FOUND)`
  * **Content:** none


### <a name="clear_collection"></a>Clear metrics collection

Clear the metrics in a collection.

* **URL**

  `/api/v1/collections/{id}`

* **Method**

  `PUT`

* **URL Params**

  `Required: id=[integer]`

* **Data Params**

  None

* **Success Responses**

  * **Code:** `204 (NO_CONTENT)`
  * **Content:** none

* **Error Responses**
  * **Code:** `404 (NOT_FOUND)`
  * **Content:** none


### <a name="delete_collection"></a>Delete collection

Delete a collection.

* **URL**

  `/api/v1/collections/{id}`

* **Method**

  `DELETE`

* **URL Params**

  `Required: id=[integer]`

* **Data Params**

  None

* **Success Responses**

  * **Code:** `204 (NO_CONTENT)`
  * **Content:** none

* **Error Responses**
  * **Code:** `404 (NOT_FOUND)`
  * **Content:** none

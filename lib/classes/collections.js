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
let instanceId = 0;

var Collections = class Collections {

  constructor() {
    this.collection = {
      id: instanceId,
      time: {
        data: {
          start: new Date().getTime(),
          end: new Date().getTime()
        },
        units: {
          start: 'UNIX time (ms)',
          end: 'UNIX time (ms)'
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
      httpUrls: {
        data: [],
        units: {
          averageResponseTime: 'ms',
          longestResponseTime: 'ms',
          hits: 'count'
        }
      }
    };
    this.cpuLoadSamples = 0;
    this.totalSystemCPULoad = 0.0;
    this.totalProcessCPULoad = 0.0;
    this.gcDurationTotal = 0.0;
    this.maxHeapUsed = 0;
    this.usedNativePeak = 0;
    this.httpURLData = {};
    // increment instance ID for next time
    instanceId += 1;
  }

  cpu(data) {
    // If new CPU data is greater than the current update the peak
    if (this.collection.cpu.data.processPeak < data.process) {
      this.collection.cpu.data.processPeak = data.process;
    }

    if (this.collection.cpu.data.systemPeak < data.system) {
      this.collection.cpu.data.systemPeak = data.system;
    }
    // Update the totals for use with average
    this.totalSystemCPULoad += data.system;
    this.totalProcessCPULoad += data.process;
    this.cpuLoadSamples++;
    this.collection.cpu.data.systemMean = (this.totalSystemCPULoad / this.cpuLoadSamples);
    this.collection.cpu.data.processMean = (this.totalProcessCPULoad / this.cpuLoadSamples);
  }


  memory(data) {
    // If new physical_used is bigger than the peak, update
    if (this.usedNativePeak < data.physical_used) {
      this.usedNativePeak = data.physical_used;
    }
    this.collection.memory.data.usedNativePeak = this.usedNativePeak;
  }

  gc(data) {
    this.gcDurationTotal += data.duration;
    this.maxHeapUsed = Math.max(this.maxHeapUsed, data.used);
    let timeSummary = (this.gcDurationTotal / (process.uptime() * 1000));
    // The used heap should be under memory
    this.collection.memory.data.usedHeapAfterGCPeak = this.maxHeapUsed;
    // Update GC time summary
    this.collection.gc.data = {gcTime: timeSummary};
  }

  http(data) {
    let list = this.collection.httpUrls.data;
    let placeInList = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i].url === data.url && list[i].method === data.method) {
        placeInList = i;
      }
    }
    if (placeInList != -1) {
      // Recalculate the average
      let urlData = this.collection.httpUrls.data[placeInList];
      urlData.averageResponseTime = (urlData.averageResponseTime * urlData.hits + data.duration) / (urlData.hits + 1);
      urlData.hits = urlData.hits + 1;
      if (data.duration > urlData.longestResponseTime) {
        urlData.longestResponseTime = data.duration;
      }
    } else {
      let urlJSON = { url: data.url, method: data.method, hits: 1, averageResponseTime: data.duration, longestResponseTime: data.duration };
      this.collection.httpUrls.data.push(urlJSON);
    }
  }

  reset() {
    this.collection = {
      id: this.collection.id,
      time: {
        data: {
          start: new Date().getTime(),
          end: new Date().getTime()
        },
        units: {
          start: 'UNIX time (ms)',
          end: 'UNIX time (ms)'
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
      httpUrls: {
        data: [],
        units: {
          averageResponseTime: 'ms',
          longestResponseTime: 'ms',
          hits: 'count'
        }
      }
    };
    this.cpuLoadSamples = 0;
    this.totalSystemCPULoad = 0.0;
    this.totalProcessCPULoad = 0.0;
    this.gcDurationTotal = 0.0;
    this.maxHeapUsed = 0;
    this.usedNativePeak = 0;
    this.httpURLData = {};
  }

};

module.exports = Collections;

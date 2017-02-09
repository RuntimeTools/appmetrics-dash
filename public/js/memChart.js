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

// Line chart for showing memory data
// Process and system data displayed

// Define graph axes
var mem_xScale = d3.time.scale().range([0, graphWidth]);
var mem_yScale = d3.scale.linear().range([graphHeight, 0]);

var mem_xAxis = d3.svg.axis()
    .scale(mem_xScale)
    .orient("bottom")
    .ticks(3)
    .tickFormat(getTimeFormat());

var mem_yAxis = d3.svg.axis()
    .scale(mem_yScale)
    .orient("left")
    .ticks(8)
    .tickFormat(function(d) {
        return d3.format(".2s")(d * 1024 *1024);
    });

// Memory data storage
var memData = [];
var memProcessLatest = 0;
var memSystemLatest = 0;

// Set input domain for both x and y scales
mem_xScale.domain(d3.extent(memData, function(d) {
    return d.date;
}));

mem_yScale.domain([0, Math.ceil(d3.extent(memData, function(d) {
    return d.system;
})[1] / 100) * 100]);


// Define the process memory line
var mem_processLine = d3.svg.line()
    .x(function(d) {
        return  mem_xScale(d.date);
    })
    .y(function(d) {
        return mem_yScale(d.process);
    });

// Define the system memory line
var mem_systemLine = d3.svg.line()
    .x(function(d) {
        return mem_xScale(d.date);
    })
    .y(function(d) {
        return mem_yScale(d.system);
    });

// Define the memory SVG
var memSVG = d3.select("#memDiv1")
    .append("svg")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "memChart")

var memTitleBox = memSVG.append("rect")
    .attr("width", canvasWidth)
    .attr("height", 30)
    .attr("class", "titlebox")

// Define the memory Chart
var memChart = memSVG.append("g")
    .attr("class", "memGroup")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Add the system line path.
memChart.append("path")
    .attr("class", "systemLine")
    .attr("d", mem_systemLine(memData));

// Add the process line path.
memChart.append("path")
    .attr("class", "processLine")
    .attr("d", mem_processLine(memData));

// Add the X Axis
memChart.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + graphHeight + ")")
    .call(mem_xAxis);

// Add the Y Axis
memChart.append("g")
    .attr("class", "yAxis")
    .call(mem_yAxis);

// Add the title
memChart.append("text")
    .attr("x", 7 - margin.left)
    .attr("y", 15 - margin.top)
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("Memory");

// Add the system colour box
memChart.append("rect")
    .attr("x", 0) 
    .attr("y", graphHeight + margin.bottom - 15)
    .attr("class", "colourbox1")
    .attr("width", 10)
    .attr("height", 10)

// Add the SYSTEM label
var memSystemLabel = memChart.append("text")
    .attr("x", 15) 
    .attr("y", graphHeight + margin.bottom - 5)
    .attr("text-anchor", "start")
    .attr("class", "lineLabel")
    .text("System");

// Add the process colour box
memChart.append("rect")
    .attr("x", memSystemLabel.node().getBBox().width + 45) 
    .attr("y", graphHeight + margin.bottom - 15)
    .attr("width", 10)
    .attr("height", 10)
    .attr("class", "colourbox2")

// Add the PROCESS label
memChart.append("text")
    .attr("x", memSystemLabel.node().getBBox().width + 60) 
    .attr("y", graphHeight + margin.bottom - 5)
    .attr("class", "lineLabel2")
    .text("Node Process");

function resizeMemChart() {
    var chart = d3.select(".memChart")
    chart.attr("width", canvasWidth);
    mem_xScale = d3.time.scale().range([0, graphWidth]);
    mem_xAxis = d3.svg.axis().scale(mem_xScale)
        .orient("bottom").ticks(3).tickFormat(getTimeFormat());
    
    memTitleBox.attr("width", canvasWidth)

    // Redraw lines and axes
    mem_xScale.domain(d3.extent(memData, function(d) {
        return d.date;
    }));
    chart.select(".systemLine") 
        .attr("d", mem_systemLine(memData));
    chart.select(".processLine") 
        .attr("d", mem_processLine(memData));
    chart.select(".xAxis").call(mem_xAxis);
    chart.select(".yAxis").call(mem_yAxis);
}

function updateMemData() {

    socket.on('memory', function (memRequest) {
        memRequestData = JSON.parse(memRequest);  // parses the data into a JSON array
        if (!memRequestData) return;
  
        var d = memRequestData;
        d.date = new Date(+d.time);
        d.system  = +d.physical_used  / (1024 * 1024);
        d.process  = +d.physical  / (1024 * 1024);

        var _memProcessLatest = Math.round(d.process);
        // Update gauge if loaded
        if (typeof(updateMemProcessGauge) === 'function' && _memProcessLatest != memProcessLatest) {
    	    updateMemProcessGauge(d.process);
        }
        memProcessLatest = _memProcessLatest;
        memSystemLatest = Math.round(d.system);
        memData.push(d)

        // Only keep 30 minutes of data
        var currentTime = Date.now()
        var d = memData[0]
        if (d === null) return;
			
        while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
            memData.shift()
            d = memData[0]
        }

        // Set the input domain for the axes
        mem_xScale.domain(d3.extent(memData, function(d) {
            return d.date;
        }));
        mem_yScale.domain([0, Math.ceil(d3.extent(memData, function(d) {
            return d.system;
        })[1] / 100) * 100]);

        mem_xAxis.tickFormat(getTimeFormat());

        // Select the section we want to apply our changes to
        var selection = d3.select(".memChart");

        // Make the changes
        selection.select(".systemLine")
            .attr("d", mem_systemLine(memData));
        selection.select(".processLine")
            .attr("d", mem_processLine(memData));
        selection.select(".xAxis")
            .call(mem_xAxis);
        selection.select(".yAxis")
            .call(mem_yAxis);
//        selection.select(".processLatest")
//            .text(memProcessLatest + "MB");
//        selection.select(".systemLatest")
//            .text(memSystemLatest + "MB");
    });
}

updateMemData()

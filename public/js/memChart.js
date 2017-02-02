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

var mem_xAxis = d3.svg.axis().scale(mem_xScale)
			.orient("bottom").ticks(3).tickFormat(getTimeFormat());

var mem_yAxis = d3.svg.axis().scale(mem_yScale)
			.orient("left").ticks(8).tickFormat(function(d) {
				return d + "MB";
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

// Define the memChart
var memChart = d3.select("#memDiv1")
			.append("svg")
			.attr("width", canvasWidth)
			.attr("height", canvasHeight)
			.attr("class", "memChart")
			.append("g")
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
		.style("stroke", "#8cd211")
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
		.attr("x", -20)
		.attr("y", 0 - margin.top + (margin.shortTop * 0.5))
		.style("font-size", "18px")
		.text("Memory Usage");

// Add the SYSTEM label
memChart.append("text")
		.attr("x", 0) 
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "lineLabel") 
		.style("fill", "#6eedd8")
		.text("SYSTEM");

// Add the PROCESS label
memChart.append("text")
		.attr("x", graphWidth / 2)
		.attr("y", 0 - (margin.top / 8))
		.style("fill", "#8cd211")
		.attr("class", "processlatestlabel")
		.text("NODE PROCESS");

// Add the text element for systemLatest
memChart.append("text")
		.attr("x", 0)
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "systemLatest")
		.style("font-size", "32px");

// Add the text element for processLatest
memChart.append("text")
		.attr("x", graphWidth / 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "processLatest")
		.style("font-size", "32px");

function resizeMemChart() {
    var chart = d3.select(".memChart")
	chart.attr("width", canvasWidth);
    mem_xScale = d3.time.scale().range([0, graphWidth]);
    mem_xAxis = d3.svg.axis().scale(mem_xScale)
			.orient("bottom").ticks(3).tickFormat(getTimeFormat());
    chart.select(".processLatest").attr("x", graphWidth / 2)
    chart.select(".processlatestlabel").attr("x", graphWidth / 2)
    
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
	// Get the data again
	socket.on('memory', function (memRequest) {
    data = JSON.parse(memRequest);  // parses the data into a JSON array
  	if (!data)
			return
  
    var d = data;
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
	if (d === null)
		return
			
	while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
		memData.shift()
		d = memData[0]
	}

	// Set the input domain for the x axis
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
	selection.select(".systemLine") // change the line
		.attr("d", mem_systemLine(memData));
	selection.select(".processLine") // change the line
		.attr("d", mem_processLine(memData));
	selection.select(".xAxis") // change the x axis
		.call(mem_xAxis);
	selection.select(".yAxis") // change the y axis
		.call(mem_yAxis);
	//selection.select(".processLatest") // change the text
	//	.text(memProcessLatest + "MB");
	//selection.select(".systemLatest") // change the text
	//	.text(memSystemLatest + "MB");
	});
}

updateMemData()

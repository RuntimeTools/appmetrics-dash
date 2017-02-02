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

// Line chart for displaying cpu data
// System and process data displayed


// Define graph axes
var cpu_xScale = d3.time.scale().range([0, graphWidth]);
var cpu_yScale = d3.scale.linear().range([graphHeight, 0]);

var cpu_yTicks = [0, 25, 50, 75, 100];

var cpu_xAxis = d3.svg.axis().scale(cpu_xScale)
    .orient("bottom").ticks(3).tickFormat(getTimeFormat());

var cpu_yAxis = d3.svg.axis()
    .scale(cpu_yScale)
    .orient("left")
    .tickValues(cpu_yTicks)
    .tickSize(-graphWidth, 0, 0)
    .tickFormat(function(d) { return d + "%"; });


// CPU Data storage
var cpuData = [];
var cpuProcessLatest = 0;
var cpuSystemLatest = 0;


// Define the system CPU usage line
var systemline = d3.svg.line().interpolate("basis")
    .x(function(d) {
        return cpu_xScale(d.date);
    })
    .y(function(d) {
        return cpu_yScale(d.system);
    });

// Define the process CPU usage line
var processline = d3.svg.line().interpolate("basis")
    .x(function(d) {
        return cpu_xScale(d.date);
    })
    .y(function(d) {
        return cpu_yScale(d.process);
    });

// Define the cpuChart
var cpuChart = d3.select("#cpuDiv1")
        .append("svg")
        .attr("width", canvasWidth)
        .attr("height", canvasHeight)
        .attr("class", "cpuChart")
        .append("g")
        .attr("class", "cpuGroup")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

// Set the input domain for the y axis (fixed)
cpu_yScale.domain([0, 100]);

// Add the systemline path.
cpuChart.append("path")
        .attr("class", "systemLine")
        .attr("d", systemline(cpuData));

// Add the processline path.
cpuChart.append("path")
        .attr("class", "processLine")
        .style("stroke", "#8cd211")
        .attr("d", processline(cpuData));

// Add the X Axis
cpuChart.append("g")
        .attr("class", "xAxis")
        .attr("transform", "translate(0," + graphHeight + ")")
        .call(cpu_xAxis);

// Add the Y Axis
cpuChart.append("g")
        .attr("class", "yAxis")
        .call(cpu_yAxis);

// Add the title
cpuChart.append("text")
        .attr("x", -20)
        .attr("y", 0 - margin.top + (margin.shortTop * 0.5))
        .attr("text-anchor", "left")
        .style("font-size", "18px")
        .text("CPU Usage");

// Add the SYSTEM label
cpuChart.append("text")
        .attr("x", 0) 
        .attr("y", 0 - (margin.top / 8))
        .attr("class", "lineLabel") 
        .style("fill", "#6eedd8")
        .text("SYSTEM");

// Add the PROCESS label
cpuChart.append("text")
        .attr("x", graphWidth / 2) 
        .attr("y", 0 - (margin.top / 8))
        .style("fill", "#8cd211")
        .attr("class", "processlatestlabel")
        .text("NODE PROCESS");

// Add the text element for systemlatest
cpuChart.append("text")
    .attr("x", 0) 
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "systemlatest")
    .style("font-size", "32px");

// Add the text element for processlatest
cpuChart.append("text")
        .attr("x", graphWidth / 2) 
        .attr("y", 0 - (margin.top * 3 / 8))
        .attr("class", "processlatest")
        .style("font-size", "32px");


function resizeCPUChart() {
    var chart = d3.select(".cpuChart");
    chart.attr("width", canvasWidth);
    cpu_xScale= d3.time.scale().range([0, graphWidth]);
    cpu_xAxis = d3.svg.axis()
        .scale(cpu_xScale)
        .orient("bottom")
        .ticks(3)
        .tickFormat(getTimeFormat());
    cpu_yAxis.tickSize(-graphWidth, 0, 0);
    chart.select(".processlatest").attr("x", graphWidth / 2) 
    chart.select(".processlatestlabel").attr("x", graphWidth / 2)

    // Redraw lines and axes
    cpu_xScale.domain(d3.extent(cpuData, function(d) {
        return d.date;
    }));
    chart.select(".systemLine") 
        .attr("d", systemline(cpuData));
    chart.select(".processLine") 
        .attr("d", processline(cpuData));
    chart.select(".xAxis") 
        .call(cpu_xAxis);
    chart.select(".yAxis") 
        .call(cpu_yAxis);
}

function updateCPUData() {
    socket.on('cpu', function (cpuRequest) {
        cpuRequestData = JSON.parse(cpuRequest);  // parses the data into a JSON array
        if (!cpuRequestData)
            return
       
        var d = cpuRequestData;
        if(d != null && d.hasOwnProperty('time')) {
          d.date = new Date(+d.time);
          d.system = +d.system * 100;
          d.process = +d.process * 100;
          var _processLatest = Math.round(d.process);
          if(typeof(updateCpuProcessGauge) === 'function' && _processLatest != cpuProcessLatest) {
            updateCpuProcessGauge(cpuProcessLatest);
           }
            cpuProcessLatest = _processLatest;
            cpuSystemLatest = Math.round(d.system);
          }
          cpuData.push(d);
      

        // Only keep 30 minutes of data
        var currentTime = Date.now();
        var d = cpuData[0];
        if (d === null)
            return

        while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
            cpuData.shift();
            d = cpuData[0];
        }
        // Set the input domain for the x axis
            cpu_xScale.domain(d3.extent(cpuData, function(d) {
            return d.date;
        }));

        cpu_xAxis.tickFormat(getTimeFormat());

        // Select the CPU chart svg element to apply changes
        var selection = d3.select(".cpuChart");

        selection.select(".systemLine")
            .attr("d", systemline(cpuData));
        selection.select(".processLine")
            .attr("d", processline(cpuData));
        selection.select(".xAxis")
            .call(cpu_xAxis);
        selection.select(".yAxis")
            .call(cpu_yAxis);
        //selection.select(".processlatest")
        //    .text(cpuProcessLatest + "%");
        //selection.select(".systemlatest")
        //    .text(cpuSystemLatest + "%");
    });
}

updateCPUData();


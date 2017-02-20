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

// Line chart for displaying event loop latency

// Width of div allocated for this graph
var eventLoopCanvasWidth = $("#eventLoopDiv").width() - 8; // -8 for margin and
// border
var eventLoopGraphWidth = eventLoopCanvasWidth - margin.left - margin.right;

// set up the scales for x and y using the graph's dimensions
var el_xScale = d3.time.scale().range([0, eventLoopGraphWidth]);
var el_yScale = d3.scale.linear().range([graphHeight, 0]);

// data storage
var elData = [];

// set up X axis for time in HH:MM:SS
var el_xAxis = d3.svg.axis().scale(el_xScale)
    .orient("bottom").ticks(3).tickFormat(getTimeFormat());

// set up Y axis for time in ms
var el_yAxis = d3.svg.axis().scale(el_yScale)
    .orient("left").ticks(8).tickFormat(function(d) {
        return d + "ms";
    });

// line function for maximum latency
var el_max_line = d3.svg.line()
    .x(function(d) {
        return el_xScale(d.time);
    })
    .y(function(d) {
        return el_yScale(d.latency.max);
    });

// line function for minimum latency
var el_min_line = d3.svg.line()
    .x(function(d) {
        return el_xScale(d.time);
    })
    .y(function(d) {
        return el_yScale(d.latency.min);
    });

// line function for average latency
var el_avg_line = d3.svg.line()
    .x(function(d) {
        return el_xScale(d.time);
    })
    .y(function(d) {
        return el_yScale(d.latency.avg);
    });

var elSVG = d3.select("#eventLoopDiv")
    .append("svg")
    .attr("width", eventLoopCanvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "elChart")

var elTitleBox = elSVG.append("rect")
    .attr("width", eventLoopCanvasWidth)
    .attr("height", 30)
    .attr("class", "titlebox")

// define the chart canvas
var elChart = elSVG
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Scale the X range to the data's time interval
el_xScale.domain(d3.extent(elData, function(d) {
    return d.time;
}));

// Scale the Y range from 0 to the largest maximum latency
el_yScale.domain([0, Math.ceil(d3.extent(elData, function(d) {
    return d.latency.max;
})[1] * 1000) / 1000]);

// Draw the max line path.
elChart.append("path")
    .attr("class", "line1")
    .attr("d", el_max_line(elData));

// Draw the min line path.
elChart.append("path")
    .attr("class", "line2")
    .attr("d", el_min_line(elData));

// Draw the avg line path.
elChart.append("path")
    .attr("class", "line3")
    .attr("d", el_avg_line(elData));

// Draw the X Axis
elChart.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + graphHeight + ")")
    .call(el_xAxis);

// Draw the Y Axis
elChart.append("g")
    .attr("class", "yAxis")
    .call(el_yAxis);

// Draw the title
elChart.append("text")
    .attr("x", 7 - margin.left)
    .attr("y", 15 - margin.top)
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("Event Loop Latency");

// Add the placeholder text
var elChartPlaceholder = elChart.append("text")
    .attr("x", eventLoopGraphWidth/2)
    .attr("y", graphHeight/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("No Data Available");

// Add the MAXIMUM colour box
elChart.append("rect")
    .attr("x", 0) 
    .attr("y", graphHeight + margin.bottom - 15)
    .attr("class", "colourbox1")
    .attr("width", 10)
    .attr("height", 10)

// Add the MAXIMUM line label
var elMaxLabel = elChart.append("text")
    .attr("x", 15) 
    .attr("y", graphHeight + margin.bottom - 5)
    .attr("text-anchor", "start")
    .attr("class", "lineLabel")
    .text("Maximum");

// Add the MINIMUM colour box
elChart.append("rect")
    .attr("x", elMaxLabel.node().getBBox().width + 25) 
    .attr("y", graphHeight + margin.bottom - 15)
    .attr("width", 10)
    .attr("height", 10)
    .attr("class", "colourbox2")

// Add the MINIMUM line label
var elMinLabel = elChart.append("text")
    .attr("x", elMaxLabel.node().getBBox().width + 40) 
    .attr("y", graphHeight + margin.bottom - 5)
    .attr("class", "lineLabel")
    .text("Minimum");

// Add the AVERAGE colour box
elChart.append("rect")
    .attr("x", elMaxLabel.node().getBBox().width + elMinLabel.node().getBBox().width + 50) 
    .attr("y", graphHeight + margin.bottom - 15)
    .attr("width", 10)
    .attr("height", 10)
    .attr("class", "colourbox3")

// Add the AVERAGE line label
elChart.append("text")
    .attr("x", elMaxLabel.node().getBBox().width + elMinLabel.node().getBBox().width + 65) 
    .attr("y", graphHeight + margin.bottom - 5)
    .attr("class", "lineLabel")
    .text("Average");

// Draw the Latest MAX Data
elChart.append("text")
    .attr("x", 0)
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "maxlatest")
    .style("font-size", "32px");

// Draw the Latest MIN Data
elChart.append("text")
    .attr("x", eventLoopGraphWidth / 3) // 1/3 across
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "minlatest")
    .style("font-size", "32px");

// Draw the Latest AVG Data
elChart.append("text")
    .attr("x", (eventLoopGraphWidth / 3) * 2) // 2/3 across
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "avglatest")
    .style("font-size", "32px");

// variables to display the latest data
var maxLatest = 0;
var minLatest = 0;
var avgLatest = 0;

function resizeEventLoopChart() {
    eventLoopCanvasWidth = $("#eventLoopDiv").width() - 8;
    eventLoopGraphWidth = eventLoopCanvasWidth - margin.left - margin.right;

    // just doing horizontal resizes for now
    //resize the canvas
    var chart = d3.select(".elChart")
    chart.attr("width", eventLoopCanvasWidth);
    //resize the scale and axes
    el_xScale = d3.time.scale().range([0, eventLoopGraphWidth]);
    el_xAxis = d3.svg.axis()
        .scale(el_xScale)
        .orient("bottom")
        .ticks(3)
        .tickFormat(getTimeFormat());

    elTitleBox.attr("width", eventLoopCanvasWidth)

    el_xScale.domain(d3.extent(elData, function(d) {
        return d.time;
    }));
    // update the data lines
    chart.select(".line1")
        .attr("d", el_max_line(elData));
    chart.select(".line2")
        .attr("d", el_min_line(elData));
    chart.select(".line3")
        .attr("d", el_avg_line(elData));
    // update the axes
    chart.select(".xAxis")
        .call(el_xAxis);
    chart.select(".yAxis")
        .call(el_yAxis);
}

function updateEventLoopData() {

    socket.on('eventloop', function (elRequest){
        elRequestData = JSON.parse(elRequest);  // parses the data into a JSON array  

        if (!elRequestData) return;
        var d = elRequestData;
        d.latency.min  = +d.latency.min;
        d.latency.max  = +d.latency.max;
        d.latency.avg  = +d.latency.avg;
        //round the latest data to the nearest thousandth
        minLatest = Math.round(d.latency.min * 1000) / 1000;
        maxLatest = Math.round(d.latency.max * 1000) / 1000;
        avgLatest = Math.round(d.latency.avg * 1000) / 1000;
        elData.push(d)

        if(elData.length === 2) {
            // second data point - remove "No Data Available" label
            elChartPlaceholder.attr("visibility", "hidden");
        }
        // Only keep 'maxTimeWindow' (defined in index.html) milliseconds of data
        var currentTime = Date.now()
        var d = elData[0]
        while (d.hasOwnProperty('time') && d.time + maxTimeWindow < currentTime) {
            elData.shift()
            d = elData[0]
        }

        // Re-scale the X range to the new data time interval
        el_xScale.domain(d3.extent(elData, function(d) {
            return d.time;
        }));
        // Re-scale the Y range to the new largest max latency
        el_yScale.domain([0, Math.ceil(d3.extent(elData, function(d) {
            return d.latency.max;
        })[1] * 1000) / 1000]);

        el_xAxis.tickFormat(getTimeFormat());

        var selection = d3.select(".elChart");
        // update the data lines
        selection.select(".line1")
            .attr("d", el_max_line(elData));
        selection.select(".line2")
            .attr("d", el_min_line(elData));
        selection.select(".line3")
            .attr("d", el_avg_line(elData));
        // update the axes
        selection.select(".xAxis")
            .call(el_xAxis);
        selection.select(".yAxis")
            .call(el_yAxis);
	});
}

updateEventLoopData()


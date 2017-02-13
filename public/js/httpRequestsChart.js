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

// Line chart for displaying http requests with time and duration

var http_xScale = d3.time.scale().range([0, httpGraphWidth]);
var http_yScale = d3.scale.linear().range([tallerGraphHeight, 0]);

var httpData = [];

var http_xAxis = d3.svg.axis()
    .scale(http_xScale)
    .orient("bottom")
    .ticks(3)
    .tickFormat(getTimeFormat());

var http_yAxis = d3.svg.axis()
    .scale(http_yScale)
    .orient("left")
    .ticks(5)
    .tickFormat(function(d) {
        return d + "ms";
    });

var mouseOverHttpGraph = false;

// Define the HTTP request time line
var httpline = d3.svg.line()
    .x(function(d) {
        return http_xScale(d.date);
    })
    .y(function(d) {
        return http_yScale(d.duration);
    });

var httpSVG = d3.select("#httpDiv1")
    .append("svg")
    .attr("width", httpCanvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "httpChart")
    .on("mouseover", function() {
        mouseOverHttpGraph = true;
    })
    .on("mouseout", function() {
        mouseOverHttpGraph = false;
    })

var httpTitleBox = httpSVG.append("rect")
    .attr("width", httpCanvasWidth)
    .attr("height", 30)
    .attr("class", "titlebox")

var httpChart = httpSVG.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Create the line
httpChart.append("path")
    .attr("class", "httpline")
    .attr("d", httpline(httpData));

// Define the axes
httpChart.append("g")
    .attr("class", "xAxis")
    .attr("transform", "translate(0," + tallerGraphHeight + ")")
    .call(http_xAxis);

httpChart.append("g")
    .attr("class", "yAxis")
    .call(http_yAxis);

// Add the title
httpChart.append("text")
    .attr("x", 7 - margin.left)
    .attr("y", 15 - margin.top)
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("HTTP Incoming Requests");

// Add the placeholder text
var httpChartPlaceholder = httpChart.append("text")
    .attr("x", httpGraphWidth/2)
    .attr("y", tallerGraphHeight/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("No Data Available");

function updateHttpData() {
    socket.on('http', function (httpRequest){
        httpRequestData = JSON.parse(httpRequest);  // parses the data into a JSON array
        if (httpRequestData.length == 0) return;

        if(httpData.length === 0) {
            // first data - remove "No Data Available" label
            httpChartPlaceholder.attr("visibility", "hidden");
        }

        for (var i = 0, len = httpRequestData.length; i < len; i++) {
            var d = httpRequestData[i];
            if (d != null && d.hasOwnProperty('time')) {
                d.date = new Date(+d.time);
                d.responseTime = Math.round(+d.duration)
                httpData.push(d)
            }
        }

        // Only keep 30 minutes or 2000 items of data
        var currentTime = Date.now()
        var d = httpData[0]
        while (httpData.length > 2000 || (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime)) {
            httpData.shift()
            d = httpData[0]
        }
        // Don't redraw graph if mouse is over it (keeps it still for tooltips)
        if(!mouseOverHttpGraph) {
            // Set the input domain for x and y axes
            http_xScale.domain(d3.extent(httpData, function(d) {
                return d.date;
            }));
            http_yScale.domain([0, d3.max(httpData, function(d) {
                return d.duration;
            })]);
            http_xAxis.tickFormat(getTimeFormat());
            var selection = d3.select(".httpChart");
            selection.selectAll("circle").remove();
            selection.select(".httpline")
                .attr("d", httpline(httpData));
            selection.select(".xAxis")
                .call(http_xAxis);
            selection.select(".yAxis")
                .call(http_yAxis);
            // Add the points
            selection.selectAll("point")
                .data(httpData)
                .enter().append("circle")
                .attr("r", 4)
                .style("fill", "#5aaafa")
                .style("stroke", "white")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")
                .attr("cx", function(d) { return http_xScale(d.date); })
                .attr("cy", function(d) { return http_yScale(d.duration); })
                .append("svg:title").text(function(d) { return d.url; }); // tooltip
        }
    });
}

function resizeHttpChart() {
    var chart = d3.select(".httpChart")
    chart.attr("width", httpCanvasWidth);
    http_xScale = d3.time.scale()
        .range([0, httpGraphWidth]);
    http_xAxis = d3.svg.axis()
        .scale(http_xScale)
        .orient("bottom")
        .ticks(3)
        .tickFormat(getTimeFormat());

    httpTitleBox.attr("width", httpCanvasWidth)

    http_xScale.domain(d3.extent(httpData, function(d) {
        return d.date;
    }));

    chart.selectAll("circle").remove();

    chart.select(".httpline")
        .attr("d", httpline(httpData));
    chart.select(".xAxis")
        .call(http_xAxis);
    chart.select(".yAxis")
        .call(http_yAxis);
    chart.selectAll("point")
        .data(httpData)
        .enter().append("circle")
        .attr("r", 4)
        .style("fill", "#5aaafa")
        .style("stroke", "white")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
        .attr("cx", function(d) { return http_xScale(d.date); })
        .attr("cy", function(d) { return http_yScale(d.duration); })
        .append("svg:title").text(function(d) { return d.url; });
}

updateHttpData()


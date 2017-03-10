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

/* exported resizeHttpOBChart */

// Line chart for displaying http outbound requests with time and duration

var httpOB_xScale = d3.time.scale().range([0, httpGraphWidth]);
var httpOB_yScale = d3.scale.linear().range([tallerGraphHeight, 0]);

var httpOBData = [];

var httpOB_xAxis = d3.svg.axis()
.scale(httpOB_xScale)
.orient("bottom")
.ticks(3)
.tickFormat(d3.time.format("%H:%M:%S"));

var httpOB_yAxis = d3.svg.axis()
.scale(httpOB_yScale)
.orient("left")
.ticks(5)
.tickFormat(function(d) {
  return d + "ms";
});

var mouseOverHttpOBGraph = false;

// Define the HTTP request time line
var httpOBline = d3.svg.line()
.x(function(d) {
  return httpOB_xScale(d.time);
})
.y(function(d) {
  return httpOB_yScale(d.longest);
});

var httpOBSVG = d3.select("#httpOBDiv")
.append("svg")
.attr("width", httpCanvasWidth)
.attr("height", canvasHeight)
.attr("class", "httpOBChart")
.on("mouseover", function() {
  mouseOverHttpOBGraph = true;
})
.on("mouseout", function() {
  mouseOverHttpOBGraph = false;
});

var httpOBTitleBox = httpOBSVG.append("rect")
.attr("width", httpCanvasWidth)
.attr("height", 30)
.attr("class", "titlebox");

var httpOBChart = httpOBSVG
.append("g")
.attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Create the line
httpOBChart.append("path")
.attr("class", "httpline")
.attr("d", httpOBline(httpOBData));

// Define the axes
httpOBChart.append("g")
.attr("class", "xAxis")
.attr("transform", "translate(0," + tallerGraphHeight + ")")
.call(httpOB_xAxis);

httpOBChart.append("g")
.attr("class", "yAxis")
.call(httpOB_yAxis);

// Add the title
httpOBChart.append("text")
.attr("x", 7 - margin.left)
.attr("y", 15 - margin.top)
.attr("dominant-baseline", "central")
.style("font-size", "18px")
.text("HTTP Outbound Requests");

// Add the placeholder text
var httpOBChartPlaceholder = httpOBChart.append("text")
    .attr("x", httpGraphWidth / 2)
    .attr("y", tallerGraphHeight / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("No Data Available");

function updateHttpOBData() {
  socket.on("http-outbound", function(httpOutboundRequest) {
    httpOutboundRequestData = JSON.parse(httpOutboundRequest);  // parses the data into a JSON array
    if (httpOutboundRequestData == null || httpOutboundRequestData.length == 0) return;

    if (httpOBData.length === 0) {
            // first data - remove "No Data Available" label
      httpOBChartPlaceholder.attr("visibility", "hidden");
    }

        // for (var i = 0, len = httpOutboundRequestData.length; i < len; i++) {
        //    var d = httpOutboundRequestData[i];
        //    if (d != null && d.hasOwnProperty('time')) {
        //        httpOBData.push(d)
        //    }
        // }
    httpOBData.push(httpOutboundRequestData);

        // Only keep 'maxTimeWindow' (defined in index.html) milliseconds of data
    var currentTime = Date.now();
    var d = httpOBData[0];
    while (d.hasOwnProperty("time") && d.time + maxTimeWindow < currentTime) {
      httpOBData.shift();
      d = httpOBData[0];
    }

        // Don't update if mouse over graph
    if (!mouseOverHttpOBGraph) {

            // Set the input domain for x and y axes
      httpOB_xScale.domain(d3.extent(httpOBData, function(d) {
        return d.time;
      }));
      httpOB_yScale.domain([0, d3.max(httpOBData, function(d) {
        return d.longest;
      })]);

      var selection = d3.select(".httpOBChart");
      selection.selectAll("circle").remove();

      selection.select(".httpline")
            .attr("d", httpOBline(httpOBData));
      selection.select(".xAxis")
            .call(httpOB_xAxis);
      selection.select(".yAxis")
            .call(httpOB_yAxis);
            // Add the points
      selection.selectAll("point")
            .data(httpOBData)
            .enter().append("circle")
            .attr("r", 4)
            .style("fill", "#5aaafa")
            .style("stroke", "white")
            .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")")
                    .attr("cx", function(d) { return httpOB_xScale(d.time); })
                    .attr("cy", function(d) { return httpOB_yScale(d.longest); })
                    .append("svg:title").text(function(d) { // tooltip
                      if (d.total === 1) {
                        return d.url;
                      } else {
                        return d.total
                         + " requests\n average duration = "
                         + d3.format(".2s")(d.average)
                         + "ms\n longest duration = "
                         + d3.format(".2s")(d.longest)
                         + "ms for URL: " + d.url;
                      }
                    });

    }
  });
}

function resizeHttpOBChart() {
  var chart = d3.select(".httpOBChart");
  chart.attr("width", httpCanvasWidth);
  httpOB_xScale = d3.time.scale()
    .range([0, httpGraphWidth]);
  httpOB_xAxis = d3.svg.axis()
    .scale(httpOB_xScale)
    .orient("bottom")
    .ticks(3);

  httpOB_xScale.domain(d3.extent(httpOBData, function(d) {
    return d.time;
  }));

  httpOBTitleBox.attr("width", httpCanvasWidth);

  chart.selectAll("circle").remove();

  chart.select(".httpline")
    .attr("d", httpOBline(httpOBData));
  chart.select(".xAxis")
    .call(httpOB_xAxis);
  chart.select(".yAxis")
    .call(httpOB_yAxis);
  chart.selectAll("point")
    .data(httpOBData)
    .enter().append("circle")
    .attr("r", 4)
    .style("fill", "#5aaafa")
    .style("stroke", "white")
    .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")")
            .attr("cx", function(d) { return httpOB_xScale(d.time); })
            .attr("cy", function(d) { return httpOB_yScale(d.longest); })
            .append("svg:title").text(function(d) { return d.url; });
}

updateHttpOBData();


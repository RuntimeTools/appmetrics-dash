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

/* exported resizeHttpTop5Chart */

// Bar chart for top 5 URLs by average request time

var httpTop5Data = [];

var httpTop5_barHeight = tallerGraphHeight / 5;

var httpDiv3CanvasWidth = $("#httpDiv3").width() - 8; // -8 for margin and border
var httpDiv3GraphWidth = httpDiv3CanvasWidth - margin.left - margin.right;

var httpTop5_xScale = d3.scale.linear().range([0, httpDiv3GraphWidth]);

var httpTop5SVG = d3.select("#httpDiv3")
    .append("svg")
    .attr("width", httpDiv3CanvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "httpTop5Chart");

var httpTop5TitleBox = httpTop5SVG.append("rect")
    .attr("width", httpDiv3CanvasWidth)
    .attr("height", 30)
    .attr("class", "titlebox");

var httpTop5Chart = httpTop5SVG.append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Add the title
httpTop5Chart.append("text")
    .attr("x", 7 - margin.left)
    .attr("y", 15 - margin.top)
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("Average Response Times (top 5)");

// Add the placeholder text
var httpTop5ChartPlaceholder = httpTop5Chart.append("text")
    .attr("x", httpDiv3GraphWidth / 2)
    .attr("y", graphHeight / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("No Data Available");

function convertURL(url, httpDiv3GraphWidth) {
  var stringToDisplay = url.toString();
  if (stringToDisplay.startsWith("http://" + myurl)) {
    stringToDisplay = stringToDisplay.substring(myurl.length + 7);
  }
  // Do a rough calculation to find out whether the URL will need more space than is available and truncate if it does
  var stringLength = stringToDisplay.length;
  var charSpaceAvailable = Math.floor(httpDiv3GraphWidth / 8); // allow 8 pixels per character (higher than needed but allows space for the time at the end)
  if (stringLength > charSpaceAvailable) {
    stringToDisplay = "..." + stringToDisplay.substring(stringLength - charSpaceAvailable - 3);
  }
  return stringToDisplay;
}


function updateChart() {

  httpTop5_xScale.domain([0, d3.max(httpTop5Data, function(d) {
    return d.averageResponseTime;
  })]);

  var bar = d3.select(".httpTop5Chart").selectAll(".bar")
        .data(httpTop5Data)
        .enter().append("g").attr("class", "bar")
        .attr("transform", function(d, i) {
          return "translate(50," + (margin.top + i * httpTop5_barHeight) + ")";
        });

    // Background
  bar.append("rect")
        .attr("width", httpDiv3GraphWidth)
        .attr("height", httpTop5_barHeight - 4)
        .style("fill", "#9fa7a7");

  bar.append("rect")
        .attr("width", function(d) {
          return httpTop5_xScale(d.averageResponseTime);
        })
        .attr("height", httpTop5_barHeight - 4);

  bar.append("text")
        .attr("x", 2)
        .attr("y", httpTop5_barHeight / 2)
        .attr("dy", ".35em")
        .attr("fill", "white")
        .text(function(d) {
          return convertURL(d.url, httpDiv3GraphWidth);
        });

  bar.append("text")
        .attr("x", httpDiv3GraphWidth - 2)
        .attr("y", httpTop5_barHeight / 2)
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .attr("dy", ".35em")
        .text(function(d) {
          return d3.format(",.2f")(d.averageResponseTime) + "ms";
        });

    // Tooltip
  bar.append("svg:title").text(function(d) { return d.url; });
}

updateChart();

function updateHttpAverages(workingData) {
  httpTop5Data = workingData.sort(function(a, b) {
    if (a.averageResponseTime > b.averageResponseTime) {
      return -1;
    }
    if (a.averageResponseTime < b.averageResponseTime) {
      return 1;
    }
        // a must be equal to b
    return 0;
  });
  if (httpTop5Data.length > 5) {
    httpTop5Data = httpTop5Data.slice(0, 5);
  }
  updateChart();
}

function updateURLData() {
    // Get the HTTP average response times
  socket.on("http-urls", function(httpTop5Request){
    if (httpTop5Data.length == 0) {
            // first data - remove "No Data Available" label
      httpTop5ChartPlaceholder.attr("visibility", "hidden");
    }

    httpTop5RequestData = JSON.parse(httpTop5Request);  // parses the data into a

    updateHttpAverages(httpTop5RequestData);

  });
}

function resizeHttpTop5Chart() {
  httpDiv3CanvasWidth = $("#httpDiv3").width() - 8;
  httpDiv3GraphWidth = httpDiv3CanvasWidth - margin.left - margin.right;
  httpTop5_xScale = d3.scale.linear().range([0, httpDiv3GraphWidth]);
  var chart = d3.select(".httpTop5Chart");
  chart.attr("width", httpDiv3CanvasWidth);
  httpTop5TitleBox.attr("width", httpDiv3CanvasWidth);
  updateChart();
}

updateURLData();

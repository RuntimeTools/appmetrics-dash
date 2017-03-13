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

/* exported resizeEnvTable */

// Table for displaying environment parameters

// Width of environment div
var envDivCanvasWidth = $("#envDiv").width() - 8;

var tableRowHeight = 30;
var tableRowWidth = 170;

// Define the environment chart space
var envSVG = d3.select("#envDiv")
    .append("svg")
    .attr("width", envDivCanvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "envData");

var envTitleBox = envSVG.append("rect")
    .attr("width", envDivCanvasWidth)
    .attr("height", 30)
    .attr("class", "titlebox");

envSVG.append("text")
    .attr("x", 7)
    .attr("y", 15)
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("Environment");

var paragraph = envSVG.append("g")
    .attr("class", "envGroup")
    .attr("transform",
        "translate(" + 20 + "," + (margin.top + 10) + ")");

function populateEnvTable() {
  socket.on("environment", function(envRequest){
    envRequestData = JSON.parse(envRequest);
    if (envRequestData == null) return;

    function tabulate(data) {

            // create a row for each object in the data
      var rows = paragraph.selectAll("text")
                .data(data)
                .enter()
                .append("text")
                .style("font-size", "14px")
                .attr("transform", function(d, i) {
                  return "translate(0," + (i * tableRowHeight) + ")";
                });

            // create a cell in each row for each column
      rows.selectAll("tspan")
                .data(function(row) {
                  return ["Parameter", "Value"].map(function(column) {
                    return {column: column, value: row[column]};
                  });
                })
                .enter()
                .append("tspan")
                .attr("x", function(d, i) {
                  return i * tableRowWidth; // indent second element for each row
                })
                .text(function(d) { return d.value; })
                .append("svg:title") // tooltip
                .text(function(d) { return d.value; })
    }

        // render the table(s)
    tabulate(envRequestData); // 2 column table

  });
}

function resizeEnvTable() {
  envDivCanvasWidth = $("#envDiv").width() - 8;
  envSVG.attr("width", envDivCanvasWidth);
  envTitleBox.attr("width", envDivCanvasWidth);
}

populateEnvTable();



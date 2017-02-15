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

// Line chart for displaying GC-reported heap size and used heap size

// set up axes scales to the dimensions of the graph
var gc_xScale = d3.time.scale().range([0, graphWidth]);
var gc_yScale = d3.scale.linear().range([graphHeight, 0]);

// GC data storage
var gcData = [];

// set up X axis for time as HH:MM:SS or HH:MM depending on time elapsed
var gc_xAxis = d3.svg.axis()
    .scale(gc_xScale)
    .orient("bottom")
    .ticks(3)
    .tickFormat(getTimeFormat());

// set up Y axis for memory
var gc_yAxis = d3.svg.axis()
    .scale(gc_yScale)
    .orient("left")
    .ticks(8)
    .tickFormat(function(d) {
        return d3.format(".2s")(d * 1024 * 1024)
    });

// line function for heap size
var gc_size_line = d3.svg.line()
.x(function(d) {
    return  gc_xScale(d.time);
})
.y(function(d) {
    return gc_yScale(d.size);
});

// line function for used heap size
var gc_used_line = d3.svg.line()
.x(function(d) {
    return gc_xScale(d.time);
})
.y(function(d) {
    return gc_yScale(d.used);
});

var gcSVG = d3.select("#gcDiv")
.append("svg")
.attr("width", canvasWidth)
.attr("height", canvasHeight)
.attr("class", "gcChart")

var gcTitleBox = gcSVG.append("rect")
.attr("width", canvasWidth)
.attr("height", 30)
.attr("class", "titlebox")

// create the chart canvas
var gcChart = gcSVG
.append("g")
.attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

// Draw the heap size path.
gcChart.append("path")
.attr("class", "line1")
.attr("d", gc_size_line(gcData));

// Draw the used heap path.
gcChart.append("path")
.attr("class", "line2")
.attr("d", gc_used_line(gcData));

// Draw the X Axis
gcChart.append("g")
.attr("class", "xAxis")
.attr("transform", "translate(0," + graphHeight + ")")
.call(gc_xAxis);

// Draw the Y Axis
gcChart.append("g")
.attr("class", "yAxis")
.call(gc_yAxis);

// Draw the title
gcChart.append("text")
.attr("x", 7 - margin.left)
.attr("y", 15 - margin.top)
.attr("dominant-baseline", "central")
.style("font-size", "18px")
.text("Heap");

// Add the placeholder text
var gcChartPlaceholder = gcChart.append("text")
    .attr("x", graphWidth/2)
    .attr("y", graphHeight/2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("No Data Available");

// Add the heap size colour box
gcChart.append("rect")
.attr("x", 0) 
.attr("y", graphHeight + margin.bottom - 15)
.attr("class", "colourbox1")
.attr("width", 10)
.attr("height", 10)

// Add the heap size label
var gcHeapSizeLabel = gcChart.append("text")
.attr("x", 15) 
.attr("y", graphHeight + margin.bottom - 5)
.attr("text-anchor", "start")
.attr("class", "lineLabel")
.text("Heap Size");

// Add the used heap colour box
gcChart.append("rect")
.attr("x", gcHeapSizeLabel.node().getBBox().width + 25) 
.attr("y", graphHeight + margin.bottom - 15)
.attr("width", 10)
.attr("height", 10)
.attr("class", "colourbox2")

// Add the used heap label
gcChart.append("text")
.attr("x", gcHeapSizeLabel.node().getBBox().width + 40) 
.attr("y", graphHeight + margin.bottom - 5)
.attr("class", "lineLabel2")
.text("Used Heap");

// Draw the Latest HEAP SIZE Data
gcChart.append("text")
.attr("x", 0)
.attr("y", 0 - (margin.top * 3 / 8))
.attr("class", "sizelatest")
.style("font-size", "32px");

// Draw the Latest USED HEAP Data
gcChart.append("text")
.attr("x", graphWidth / 2) // 1/2 along
.attr("y", 0 - (margin.top * 3 / 8))
.attr("class", "usedlatest")
.style("font-size", "32px");

// latest data storage
var sizeLatest = 0;
var usedLatest = 0;

function resizeGCChart() {
    // only doing horizontal resize at the moment
    // resize the canvas
    var chart = d3.select(".gcChart")
    chart.attr("width", canvasWidth);
    // resize the scale's drawing range
    gc_xScale = d3.time.scale().range([0, graphWidth]);
    // resize the X axis
    gc_xAxis = d3.svg.axis()
    .scale(gc_xScale)
    .orient("bottom")
    .ticks(3)
    .tickFormat(getTimeFormat());

    gcTitleBox.attr("width", canvasWidth)

    // Redraw lines and axes
    gc_xScale.domain(d3.extent(gcData, function(d) {
        return d.time;
    }));
    chart.select(".line1")
    .attr("d", gc_size_line(gcData));
    chart.select(".line2")
    .attr("d", gc_used_line(gcData));
    chart.select(".xAxis") 
    .call(gc_xAxis);
    chart.select(".yAxis") 
    .call(gc_yAxis);
}

function updateGCData() {

    socket.on('gc', function (gcRequest){
        gcRequestData = JSON.parse(gcRequest);  // parses the data into a JSON array
        if (!gcRequestData) return;

        if(gcData.length < 2 && gcData.length + gcRequestData.length >= 2) {
            // second data point - remove "No Data Available" label
            gcChartPlaceholder.attr("visibility", "hidden");
        }

        for (var i = 0, len = gcRequestData.length; i < len; i++) {
            var d = gcRequestData[i];

            d.time = new Date(+d.time);
            // store data in MB from B
            d.used  = +d.used  / (1024 * 1024);
            d.size  = +d.size  / (1024 * 1024);
            // round latest data to nearest whole MB
            sizeLatest = Math.round(d.size);
            usedLatest = Math.round(d.used);
            gcData.push(d)
        }

        // Only keep 30 minutes or 'maxDataPoints' (defined in index.html) items of data
        var currentTime = Date.now()
        var d = gcData[0]
        while (gcData.length > maxDataPoints || (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime)) {
            gcData.shift()
            d = gcData[0]
        }

        // Scale the X range to the new data time interval
        gc_xScale.domain(d3.extent(gcData, function(d) {
            return d.time;
        }));
        // Scale the Y range to the new maximum heap size
        gc_yScale.domain([0, Math.ceil(d3.extent(gcData, function(d) {
            return d.size;
        })[1])]);

        gc_xAxis.tickFormat(getTimeFormat());

        var selection = d3.select(".gcChart");
        // Update the data lines
        selection.select(".line1")
        .attr("d", gc_size_line(gcData));
        selection.select(".line2")
        .attr("d", gc_used_line(gcData));
        // Update the axes
        selection.select(".xAxis")
        .call(gc_xAxis);
        selection.select(".yAxis")
        .call(gc_yAxis);
        // Update the latest texts
        // selection.select(".sizelatest")
        // .text(sizeLatest + "MB");
        // selection.select(".usedlatest")
        // .text(usedLatest + "MB");
    });
}

updateGCData()


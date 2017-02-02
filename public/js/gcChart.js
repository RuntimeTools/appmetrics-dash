//set up axes scales to the dimensions of the graph
var gc_xScale = d3.time.scale().range([0, graphWidth]);
var gc_yScale = d3.scale.linear().range([graphHeight, 0]);

// GC data storage
var gcData = [];

// set up X axis for time as HH:MM:SS
var gc_xAxis = d3.svg.axis().scale(gc_xScale)
    .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

// set up Y axis for memory in MB
var gc_yAxis = d3.svg.axis().scale(gc_yScale)
    .orient("left").ticks(8).tickFormat(function(d) {
        return d + "MB";
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

// create the chart canvas
var gcChart = d3.select("#gcDiv")
    .append("svg")
    .attr("width", canvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "gcChart")
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
    .attr("x", -20)
    .attr("y", 0 - (margin.top * 0.75))
    .style("font-size", "18px")
    .text("Heap Usage");

// Draw the HEAP SIZE line label
gcChart.append("text")
    .attr("x", 0)
    .attr("y", 0 - (margin.top / 8))
    .attr("class", "lineLabel")
    .text("HEAP SIZE");

// Draw the USED HEAP line label
gcChart.append("text")
    .attr("x", graphWidth / 2) // 1/2 along
    .attr("y", 0 - (margin.top / 8))
    .attr("class", "usedlatestlabel")
    .text("USED HEAP");

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
        .tickFormat(d3.time.format("%H:%M:%S"));
    // reposition the USED HEAP text & label
    chart.select(".usedlatest").attr("x", graphWidth / 2) // 1/2 along
    chart.select(".usedlatestlabel").attr("x", graphWidth / 2) // 1/2 along

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
        data = JSON.parse(gcRequest);  // parses the data into a JSON array  
        if (!data) return;
        var d = data;
        d.time = new Date(+d.time);
        // store data in MB from B
        d.used  = +d.used  / (1024 * 1024);
        d.size  = +d.size  / (1024 * 1024);
        // round latest data to nearest whole MB
        sizeLatest = Math.round(d.size);
        usedLatest = Math.round(d.used);
        gcData.push(d)
		
        // Only keep 30 minutes of data
        var currentTime = Date.now()
        var d = gcData[0]
        while (d.hasOwnProperty('time') && d.time.valueOf() + 1800000 < currentTime) {
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
        selection.select(".sizelatest")
            .text(sizeLatest + "MB");
        selection.select(".usedlatest")
            .text(usedLatest + "MB");
    });
}

updateGCData()


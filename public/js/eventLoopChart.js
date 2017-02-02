// set up the scales for x and y using the graph's dimensions
var el_xScale = d3.time.scale().range([0, httpGraphWidth]);
var el_yScale = d3.scale.linear().range([graphHeight, 0]);

// data storage
var elData = [];

// set up X axis for time in HH:MM:SS
var el_xAxis = d3.svg.axis().scale(el_xScale)
    .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

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

// define the chart canvas
var elChart = d3.select("#eventLoopDiv")
    .append("svg")
    .attr("width", httpCanvasWidth)
    .attr("height", canvasHeight)
    .attr("class", "elChart")
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
    .attr("x", -20)
    .attr("y", 0 - (margin.top * 6 / 8))
    .style("font-size", "18px")
    .text("Event Loop Latency");

// Draw the MAXIMUM line label
elChart.append("text")
    .attr("x", 0)
    .attr("y", 0 - (margin.top / 8))
    .attr("class", "lineLabel")
    .text("MAXIMUM");

// Draw the MINIMUM line label
elChart.append("text")
    .attr("x", httpGraphWidth / 3) // 1/3 across
    .attr("y", 0 - (margin.top / 8))
    .attr("class", "minlatestlabel")
    .text("MINIMUM");

// Draw the AVERAGE line label
elChart.append("text")
    .attr("x", (httpGraphWidth / 3) * 2) // 2/3 across
    .attr("y", 0 - (margin.top / 8))
    .attr("class", "avglatestlabel")
    .text("AVERAGE");

// Draw the Latest MAX Data
elChart.append("text")
    .attr("x", 0)
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "maxlatest")
    .style("font-size", "32px");

// Draw the Latest MIN Data
elChart.append("text")
    .attr("x", httpGraphWidth / 3) // 1/3 across
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "minlatest")
    .style("font-size", "32px");

// Draw the Latest AVG Data
elChart.append("text")
    .attr("x", (httpGraphWidth / 3) * 2) // 2/3 across
    .attr("y", 0 - (margin.top * 3 / 8))
    .attr("class", "avglatest")
    .style("font-size", "32px");

// variables to display the latest data
var maxLatest = 0;
var minLatest = 0;
var avgLatest = 0;

function resizeEventLoopChart() {
    // just doing horizontal resizes for now
    //resize the canvas
    var chart = d3.select(".elChart")
    chart.attr("width", httpCanvasWidth);
    //resize the scale and axes
    el_xScale = d3.time.scale().range([0, httpGraphWidth]);
    el_xAxis = d3.svg.axis().scale(el_xScale)
        .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
    //reposition the Latest Min and Avg data & labels
    chart.select(".minlatest").attr("x", httpGraphWidth / 3) // 1/3 across
    chart.select(".minlatestlabel").attr("x", httpGraphWidth / 3) // 1/3 across
    chart.select(".avglatest").attr("x", (httpGraphWidth / 3) * 2) // 2/3 across
    chart.select(".avglatestlabel").attr("x", (httpGraphWidth / 3) * 2) // 2/3 across

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
        data = JSON.parse(elRequest);  // parses the data into a JSON array  

        if (!data) return;
        var d = data;
        d.time = new Date(+d.time);
        d.latency.min  = +d.latency.min;
        d.latency.max  = +d.latency.max;
        d.latency.avg  = +d.latency.avg;
        //round the latest data to the nearest thousandth
        minLatest = Math.round(d.latency.min * 1000) / 1000;
        maxLatest = Math.round(d.latency.max * 1000) / 1000;
        avgLatest = Math.round(d.latency.avg * 1000) / 1000;
        elData.push(d)

        // Only keep 30 minutes of data
        var currentTime = Date.now()
        var d = elData[0]
        while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
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
        // update the latest displays
        selection.select(".maxlatest")
            .text(maxLatest + "ms");
        selection.select(".minlatest")
            .text(minLatest + "ms");
        selection.select(".avglatest")
            .text(avgLatest + "ms");
	});
}

updateEventLoopData()


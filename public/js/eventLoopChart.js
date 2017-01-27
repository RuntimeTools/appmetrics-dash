var el_x = d3.time.scale().range([0, graphWidth]);
var el_y = d3.scale.linear().range([height, 0]);

var elData = [];

var el_xAxis = d3.svg.axis().scale(el_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

var el_yAxis = d3.svg.axis().scale(el_y)
			.orient("left").ticks(8).tickFormat(function(d) {
				return d + "ms";
			});

var el_max_line = d3.svg.line()
			.x(function(d) {
				return  el_x(d.time);
			})
			.y(function(d) {
				return el_y(d.latency.max);
			});

var el_min_line = d3.svg.line()
			.x(function(d) {
				return el_x(d.time);
			})
			.y(function(d) {
				return el_y(d.latency.min);
			});

var el_avg_line = d3.svg.line()
			.x(function(d) {
				return el_x(d.time);
			})
			.y(function(d) {
				return el_y(d.latency.avg);
			});

var elChart = d3.select("#eventLoopDiv")
			.append("svg")
			.attr("width", width)
			.attr("height", height + margin.top + margin.bottom)
			.attr("class", "elChart")
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
el_x.domain(d3.extent(elData, function(d) {
				return d.time;
}));

el_y.domain([0, Math.ceil(d3.extent(elData, function(d) {
				return d.latency.max;
})[1] * 1000) / 1000]);

// Add the max line path.
elChart.append("path")
		.attr("class", "line1")
		.attr("d", el_max_line(elData));

// Add the min line path.
elChart.append("path")
		.attr("class", "line2")
		.style("stroke", "yellowgreen")
		.attr("d", el_min_line(elData));

// Add the avg line path.
elChart.append("path")
		.attr("class", "line3")
		.style("stroke", "black")
		.attr("d", el_avg_line(elData));

// Add the X Axis
elChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(el_xAxis);

// Add the Y Axis
elChart.append("g")
		.attr("class", "y axis")
		.call(el_yAxis);

// Add the title
elChart.append("text")
		.attr("x", -20)
		.attr("y", 0 - (margin.top * 6 / 8))
		.style("font-size", "18px")
		.text("Event Loop Latency");

// Add the MAXIMUM Legend
elChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "steelblue")
		.text("MAXIMUM");

// Add the MINIMUM Legend
elChart.append("text")
		.attr("x", graphWidth / 3) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "yellowgreen")
		.attr("class", "minlatestlabel")
		.text("MINIMUM");

// Add the AVERAGE Legend
elChart.append("text")
		.attr("x", (graphWidth / 3) * 2) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "black")
		.attr("class", "avglatestlabel")
		.text("AVERAGE");

// Add the Latest MAX Data
elChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "maxlatest")
		.style("font-size", "32px");

// Add the Latest MIN Data
elChart.append("text")
		.attr("x", graphWidth / 3) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "minlatest")
		.style("font-size", "32px");

// Add the Latest AVG Data
elChart.append("text")
		.attr("x", (graphWidth / 3) * 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "avglatest")
		.style("font-size", "32px");

var maxLatest = 0;
var minLatest = 0;
var avgLatest = 0;

function resizeEventLoopChart() {
    var chart = d3.select(".elChart")
	chart.attr("width", width);
    el_x = d3.time.scale().range([0, graphWidth]);
    el_xAxis = d3.svg.axis().scale(el_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
    chart.select(".minlatest").attr("x", graphWidth / 3) // change the text location
    chart.select(".minlatestlabel").attr("x", graphWidth / 3) // change the text location
    chart.select(".avglatest").attr("x", (graphWidth / 3) * 2) // change the text location
    chart.select(".avglatestlabel").attr("x", (graphWidth / 3) * 2) // change the text location
}


function updateEventLoopData() {
	// Get the data again
  socket.on('eventloop', function (elRequest){
    data = JSON.parse(elRequest);  // parses the data into a JSON array  
  
 
		if (!data)
			return
  
      
    var d = data;
    d.time = new Date(+d.time);
    d.latency.min  = +d.latency.min;
    d.latency.max  = +d.latency.max;
    d.latency.avg  = +d.latency.avg;
    minLatest = Math.round(d.latency.min * 1000) / 1000;
    maxLatest = Math.round(d.latency.max * 1000) / 1000;
    avgLatest = Math.round(d.latency.avg * 1000) / 1000;
    elData.push(d)
			
		

		// Only keep 30 minutes of data
		var currentTime = Date.now()
		var d = elData[0]
		if (d === null)
			return
			
		while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
			elData.shift()
			d = elData[0]
		}

		// Scale the range of the data again
		el_x.domain(d3.extent(elData, function(d) {
			return d.time;
		}));
		el_y.domain([0, Math.ceil(d3.extent(elData, function(d) {
			return d.latency.max;
		})[1] * 1000) / 1000]);

		// Select the section we want to apply our changes to
		var selection = d3.select(".elChart");

		// Make the changes
		selection.select(".line1") // change the line
			.attr("d", el_max_line(elData));
		selection.select(".line2") // change the line
			.attr("d", el_min_line(elData));
        selection.select(".line3") // change the line
            .attr("d", el_avg_line(elData));
        selection.select(".x.axis") // change the x axis
			.call(el_xAxis);
		selection.select(".y.axis") // change the y axis
			.call(el_yAxis);
		selection.select(".maxlatest") // change the text
			.text(maxLatest + "ms");
		selection.select(".minlatest") // change the text
			.text(minLatest + "ms");
        selection.select(".avglatest") // change the text
            .text(avgLatest + "ms");
	});
}

updateEventLoopData()

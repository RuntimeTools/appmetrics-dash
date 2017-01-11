// Set the ranges
var x = d3.time.scale().range([0, width]);
var y = d3.scale.linear().range([height, 0]);

// Store Data
var cpuData = [];

// Define the axes
var xAxis = d3.svg.axis().scale(x)
	.orient("bottom").ticks(4).tickFormat(d3.time.format("%H:%M:%S"));;

var ticks = [0, 25, 50, 75, 100];

var yAxis = d3.svg.axis().scale(y)
	.orient("left").tickValues(ticks).tickFormat(function(d) {
		return d + "%";
	});

// function for the y grid lines
function make_y_axis() {
	return d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickValues(ticks);
}

// Define the system CPU usage line
var systemline = d3.svg.line().interpolate("basis")
	.x(function(d) {
		return x(d.time);
	})
	.y(function(d) {
		return y(d.system);
	});

// Define the process CPU usage line
var processline = d3.svg.line().interpolate("basis")
	.x(function(d) {
		return x(d.time);
	})
	.y(function(d) {
		return y(d.process);
	});

// Adds the svg canvas
var cpuChart = d3.select("#cpuDiv")
		.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.attr("class", "cpuChart")
		.append("g")
		.attr("transform",
			"translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
x.domain(d3.extent(cpuData, function(d) {
	return d.time;
}));
y.domain([0, 100]);

// Add the systemline path.
cpuChart.append("path")
		.attr("class", "line1")
		.attr("d", systemline(cpuData));

// Add the processline path.
cpuChart.append("path")
		.attr("class", "line2")
		.style("stroke", "yellowgreen")
		.attr("d", processline(cpuData));

// Add the X Axis
cpuChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

// Add the Y Axis
cpuChart.append("g")
		.attr("class", "y axis")
		.call(yAxis);

// Draw the y Grid lines
cpuChart.append("g")
		.attr("class", "grid")
		.call(make_y_axis()
			.tickSize(-width, 0, 0)
			.tickFormat("")
                )

// Add the title
cpuChart.append("text")
		.attr("x", -20)
		.attr("y", 0 - (margin.top * 6 / 8))
		.attr("text-anchor", "left")
		.style("font-size", "18px")
		.text("CPU Usage");

// Add the SYSTEM Legend
cpuChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "steelblue")
		.text("SYSTEM");

// Add the PROCESS Legend
cpuChart.append("text")
		.attr("x", width / 2) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "yellowgreen")
		.text("PROCESS");

// Add the Latest SYSTEM Data
cpuChart.append("text")
	.attr("x", 0) // spacing
	.attr("y", 0 - (margin.top * 3 / 8))
	.attr("class", "systemCPUlatest")
	.style("font-size", "32px");

// Add the Latest PROCESS Data
cpuChart.append("text")
		.attr("x", width / 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "processCPUlatest")
		.style("font-size", "32px");


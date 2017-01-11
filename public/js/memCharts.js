var mem_x = d3.time.scale().range([0, width]);
var mem_y = d3.scale.linear().range([height, 0]);

var memData = [];

var mem_xAxis = d3.svg.axis().scale(mem_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));;

var mem_yAxis = d3.svg.axis().scale(mem_y)
			.orient("left").ticks(8).tickFormat(function(d) {
				return d + "MB";
			});

var mem_process_line = d3.svg.line()
			.x(function(d) {
				return  mem_x(d.time);
			})
			.y(function(d) {
				return mem_y(d.physical);
			});

var mem_system_line = d3.svg.line()
			.x(function(d) {
				return mem_x(d.time);
			})
			.y(function(d) {
				return mem_y(d.physical_used);
			});

var memChart = d3.select("#memDiv")
			.append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom)
			.attr("class", "memChart")
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
mem_x.domain(d3.extent(memData, function(d) {
				return d.time;
}));

mem_y.domain([0, Math.ceil(d3.extent(memData, function(d) {
				return d.system;
})[1] / 100) * 100]);

// Add the system line path.
memChart.append("path")
		.attr("class", "line1")
		.attr("d", mem_system_line(memData));

// Add the process line path.
memChart.append("path")
		.attr("class", "line2")
		.style("stroke", "yellowgreen")
		.attr("d", mem_process_line(memData));

// Add the X Axis
memChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(mem_xAxis);

// Add the Y Axis
memChart.append("g")
		.attr("class", "y axis")
		.call(mem_yAxis);

// Add the title
memChart.append("text")
		.attr("x", 20)
		.attr("y", 0 - (margin.top * 6 / 8))
		.attr("text-anchor", "middle")
		.style("font-size", "18px")
		.text("Memory Usage");

// Add the SYSTEM Legend
memChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "steelblue")
		.text("SYSTEM");

// Add the PROCESS Legend
memChart.append("text")
		.attr("x", width / 2) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "yellowgreen")
		.text("PROCESS");

// Add the Latest SYSTEM Data
memChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "systemMEMlatest")
		.style("font-size", "32px")
		.text(systemMEMLatest + "MB");

// Add the Latest PROCESS Data
memChart.append("text")
		.attr("x", width / 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "processMEMlatest")
		.style("font-size", "32px")
		.text(processMEMLatest + "MB");


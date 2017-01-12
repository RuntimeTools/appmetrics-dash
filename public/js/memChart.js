var mem_x = d3.time.scale().range([0, graphWidth]);
var mem_y = d3.scale.linear().range([height, 0]);

var memData = [];

var mem_xAxis = d3.svg.axis().scale(mem_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

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

var memChart = d3.select("#memDiv1")
			.append("svg")
			.attr("width", width)
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
				return d.physical_used;
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
		.attr("x", -20)
		.attr("y", 0 - (margin.top * 6 / 8))
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
		.attr("x", graphWidth / 2) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "yellowgreen")
		.attr("class", "processlatestlabel")
		.text("PROCESS");

// Add the Latest SYSTEM Data
memChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "systemlatest")
		.style("font-size", "32px");

// Add the Latest PROCESS Data
memChart.append("text")
		.attr("x", graphWidth / 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "processlatest")
		.style("font-size", "32px");

var processLatest = 0;
var systemLatest = 0;

function resizeMemChart() {
    var chart = d3.select(".memChart")
	chart.attr("width", width);
    mem_x = d3.time.scale().range([0, graphWidth]);
    mem_xAxis = d3.svg.axis().scale(mem_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
    chart.select(".processlatest").attr("x", graphWidth / 2) // change the text location
    chart.select(".processlatestlabel").attr("x", graphWidth / 2) // change the text location
}


function updateMemData() {
	// Get the data again
  socket.on('memory', function (memRequest){
    data = JSON.parse(memRequest);  // parses the data into a JSON array  
  
 
		if (!data)
			return
  
      
    var d = data;
    d.time = new Date(+d.time);
    d.physical_used  = +d.physical_used  / (1024 * 1024);
    d.physical  = +d.physical  / (1024 * 1024);
    processLatest = Math.round(d.physical );
        //update gauges
    if(typeof(updateMemProcessGauge) === 'function' && _processLatest != processLatest) {
      updateMemProcessGauge(d.physical);
    }
    systemLatest = Math.round(d.physical_used);
    memData.push(d)
			
		

		// Only keep 30 minutes of data
		var currentTime = Date.now()
		var d = memData[0]
		if (d === null)
			return
			
		while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
			memData.shift()
			d = memData[0]
		}

		// Scale the range of the data again
		mem_x.domain(d3.extent(memData, function(d) {
			return d.time;
		}));
		mem_y.domain([0, Math.ceil(d3.extent(memData, function(d) {
			return d.physical_used;
		})[1] / 100) * 100]);

		// Select the section we want to apply our changes to
		var selection = d3.select(".memChart");

		// Make the changes
		selection.select(".line1") // change the line
			.attr("d", mem_system_line(memData));
		selection.select(".line2") // change the line
			.attr("d", mem_process_line(memData));
		selection.select(".x.axis") // change the x axis
			.call(mem_xAxis);
		selection.select(".y.axis") // change the y axis
			.call(mem_yAxis);
		selection.select(".processlatest") // change the text
			.text(processLatest + "MB");
		selection.select(".systemlatest") // change the text
			.text(systemLatest + "MB");
	});
}

updateMemData()

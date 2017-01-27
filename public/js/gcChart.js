var gc_x = d3.time.scale().range([0, graphWidth]);
var gc_y = d3.scale.linear().range([height, 0]);

var gcData = [];

var gc_xAxis = d3.svg.axis().scale(gc_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

var gc_yAxis = d3.svg.axis().scale(gc_y)
			.orient("left").ticks(8).tickFormat(function(d) {
				return d + "MB";
			});

var gc_size_line = d3.svg.line()
			.x(function(d) {
				return  gc_x(d.time);
			})
			.y(function(d) {
				return gc_y(d.size);
			});

var gc_used_line = d3.svg.line()
			.x(function(d) {
				return gc_x(d.time);
			})
			.y(function(d) {
				return gc_y(d.used);
			});

var gcChart = d3.select("#gcDiv")
			.append("svg")
			.attr("width", width)
			.attr("height", height + margin.top + margin.bottom)
			.attr("class", "gcChart")
			.append("g")
			.attr("transform",
				"translate(" + margin.left + "," + margin.top + ")");

// Scale the range of the data
gc_x.domain(d3.extent(gcData, function(d) {
				return d.time;
}));

gc_y.domain([0, Math.ceil(d3.extent(gcData, function(d) {
				return d.size;
})[1])]);

// Add the size line path.
gcChart.append("path")
		.attr("class", "line1")
		.attr("d", gc_size_line(gcData));

// Add the used line path.
gcChart.append("path")
		.attr("class", "line2")
		.style("stroke", "yellowgreen")
		.attr("d", gc_used_line(gcData));

// Add the X Axis
gcChart.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(gc_xAxis);

// Add the Y Axis
gcChart.append("g")
		.attr("class", "y axis")
		.call(gc_yAxis);

// Add the title
gcChart.append("text")
		.attr("x", -20)
		.attr("y", 0 - (margin.top * 6 / 8))
		.style("font-size", "18px")
		.text("Heap Usage");

// Add the USED HEAP Legend
gcChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "steelblue")
		.text("HEAP SIZE");

// Add the HEAP SIZE Legend
gcChart.append("text")
		.attr("x", graphWidth / 2) // spacing
		.attr("y", 0 - (margin.top / 8))
		.attr("class", "legend") // style the legend
		.style("fill", "yellowgreen")
		.attr("class", "usedlatestlabel")
		.text("USED HEAP");

// Add the Latest HEAP SIZE Data
gcChart.append("text")
		.attr("x", 0) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "sizelatest")
		.style("font-size", "32px");

// Add the Latest USED HEAP Data
gcChart.append("text")
		.attr("x", graphWidth / 2) // spacing
		.attr("y", 0 - (margin.top * 3 / 8))
		.attr("class", "usedlatest")
		.style("font-size", "32px");

var sizeLatest = 0;
var usedLatest = 0;

function resizeGCChart() {
    var chart = d3.select(".gcChart")
	chart.attr("width", width);
    gc_x = d3.time.scale().range([0, graphWidth]);
    gc_xAxis = d3.svg.axis().scale(gc_x)
			.orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
    chart.select(".usedlatest").attr("x", graphWidth / 2) // change the text location
    chart.select(".usedlatestlabel").attr("x", graphWidth / 2) // change the text location
}


function updateGCData() {
	// Get the data again
  socket.on('gc', function (gcRequest){
    data = JSON.parse(gcRequest);  // parses the data into a JSON array  
  
 
		if (!data)
			return
  
      
    var d = data;
    d.time = new Date(+d.time);
    d.used  = +d.used  / (1024 * 1024);
    d.size  = +d.size  / (1024 * 1024);
    sizeLatest = Math.round(d.size);
        //update gauges
    usedLatest = Math.round(d.used);
    gcData.push(d)
			
		

		// Only keep 30 minutes of data
		var currentTime = Date.now()
		var d = gcData[0]
		if (d === null)
			return
			
		while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
			gcData.shift()
			d = gcData[0]
		}

		// Scale the range of the data again
		gc_x.domain(d3.extent(gcData, function(d) {
			return d.time;
		}));
		gc_y.domain([0, Math.ceil(d3.extent(gcData, function(d) {
			return d.size;
		})[1])]);

		// Select the section we want to apply our changes to
		var selection = d3.select(".gcChart");

		// Make the changes
		selection.select(".line1") // change the line
			.attr("d", gc_size_line(gcData));
		selection.select(".line2") // change the line
			.attr("d", gc_used_line(gcData));
		selection.select(".x.axis") // change the x axis
			.call(gc_xAxis);
		selection.select(".y.axis") // change the y axis
			.call(gc_yAxis);
		selection.select(".sizelatest") // change the text
			.text(sizeLatest + "MB");
		selection.select(".usedlatest") // change the text
			.text(usedLatest + "MB");
	});
}

updateGCData()

var httpTPX = d3.time.scale().range([0, graphWidth]);
var httpTPY = d3.scale.linear().range([tallerHeight, 0]);

var httpRate = [];

var httpTPXAxis = d3.svg.axis().scale(httpTPX)
    .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));

var httpTPYAxis = d3.svg.axis().scale(httpTPY)
    .orient("left").ticks(5).tickFormat(function(d) {
        return d + " rps";
    });


var httpThroughPutline = d3.svg.line()
    .x(function(d) {
        return httpTPX(d.time);
    })
    .y(function(d) {
        return httpTPY(d.httpRate);
    });


var httpThroughPutChart = d3.select("#httpDiv2")
    .append("svg")
    .attr("width", width)
    .attr("height", tallerHeight + margin.shortTop + margin.bottom)
    .attr("class", "httpThroughPutChart")
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.shortTop + ")");

// Scale the range of the data
httpTPX.domain(d3.extent(httpRate, function(d) {
    return d.time;
}));

httpTPY.domain([0, d3.max(httpRate, function(d) {
    return d.httpRate;
})]);


httpThroughPutChart.append("path")
    .attr("class", "line")
    .attr("d", httpThroughPutline(httpRate));


httpThroughPutChart.append("text")
    .attr("x", 0) // spacing
    .attr("y", 0 - (margin.top * 3 / 8))
    .style("font-size", "32px");

// Add the X Axis
httpThroughPutChart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tallerHeight + ")")
    .call(httpTPXAxis);

// Add the Y Axis
httpThroughPutChart.append("g")
    .attr("class", "y axis")
    .call(httpTPYAxis);

// Add the title
httpThroughPutChart.append("text")
    .attr("x", -20)
    .attr("y", 0 - (margin.shortTop * 0.5))    .attr("text-anchor", "left")
    .style("font-size", "18px")
    .text("HTTP Throughput");

function updateThroughPutData() {

  socket.on('httpRate', function (httpRequest){
    data = JSON.parse(httpRequest);  // parses the data into a JSON array
     if (data.length == 0)
         return  
  
	
           	httpRate.push(data)
	
	         // Only keep 30 minutes of data
	         var currentTime = Date.now()
	         var d = httpRate[0]
	         while (d.hasOwnProperty('time') && d.time.valueOf() + 1800000 < currentTime) {
	             httpRate.shift()
	             d = httpRate[0]
	         }
	
	         // Scale the range of the data
	         httpTPX.domain(d3.extent(httpRate, function(d) {
	             return d.time;
	         }));

	         httpTPY.domain([0, d3.max(httpRate, function(d) {
	             return d.httpRate;
	         })]);


	         var selection = d3.select(".httpThroughPutChart");
	
	         selection.select(".line") // change the line
	             .attr("d", httpThroughPutline(httpRate));
	         selection.select(".x.axis") // change the x axis
	             .call(httpTPXAxis);
	         selection.select(".y.axis") // change the y axis
	             .call(httpTPYAxis);
	     });
}



function resizeHttpThroughputChart() {
    var chart = d3.select(".httpThroughPutChart")
	chart.attr("width", width);
    httpTPX = d3.time.scale().range([0, graphWidth]);
    httpTPXAxis = d3.svg.axis().scale(httpTPX)
        .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
}

setInterval(updateThroughPutData, 2000);
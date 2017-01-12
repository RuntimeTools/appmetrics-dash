var x2 = d3.time.scale().range([0, httpGraphWidth]);
var y2 = d3.scale.linear().range([tallerHeight, 0]);

var httpData = [],
    httpMax = 0;

var xAxis2 = d3.svg.axis().scale(x2)
    .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));;

var yAxis2 = d3.svg.axis().scale(y2)
    .orient("left").ticks(5).tickFormat(function(d) {
        return d + "ms";
    });

var mouseOverHttpGraph = false;

// Define the HTTP request time line
var httpline = d3.svg.line()
    .x(function(d) {
        return x2(d.date);
    })
    .y(function(d) {
        return y2(d.duration);
    });

var httpChart = d3.select("#httpDiv1")
    .append("svg")
    .attr("width", httpWidth)
    .attr("height", tallerHeight + margin.shortTop + margin.bottom)
    .attr("class", "httpChart")
    .append("g")
    .attr("transform",
        "translate(" + margin.left + "," + margin.shortTop + ")");

// Scale the range of the data
x2.domain(d3.extent(httpData, function(d) {
    return d.date;
}));
y2.domain([0, httpMax]);

// Add the systemline path.
httpChart.append("path")
    .attr("class", "line")
    .attr("d", httpline(httpData));

// Add the X Axis
httpChart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + tallerHeight + ")")
    .call(xAxis2);

// Add the Y Axis
httpChart.append("g")
    .attr("class", "y axis")
    .call(yAxis2);

// Add the title
httpChart.append("text")
    .attr("x", -20)
    .attr("y", 0 - (margin.shortTop * 0.5))
    .attr("text-anchor", "left")
    .attr("dominant-baseline", "central")
    .style("font-size", "18px")
    .text("HTTP Response Time");



function updateHttpData() {
  socket.on('http', function (httpRequest){
    data = JSON.parse(httpRequest);  // parses the data into a JSON array
     if (data.length == 0)
         return
 
            var d = data;
            if (d != null && d.hasOwnProperty('time')) {
                d.date = new Date(+d.time);
            	d.responseTime = Math.round(+d.duration)
            	if (d.responseTime > httpMax)
                	httpMax = d.responseTime;
            	httpData.push(d)
            }
        

        // Only keep 30 minutes of data
        var currentTime = Date.now()
        var d = httpData[0]
       	while (d.hasOwnProperty('date') && d.date.valueOf() + 1800000 < currentTime) {
            httpData.shift()
           	d = httpData[0]
       	}

        // Scale the range of the data
        x2.domain(d3.extent(httpData, function(d) {
            return d.date;
        }));
        y2.domain([0, httpMax]);

        var selection = d3.select(".httpChart");

        selection.select(".line") // change the line
            .attr("d", httpline(httpData));
        selection.select(".x.axis") // change the x axis
            .call(xAxis2);
        selection.select(".y.axis") // change the y axis
            .call(yAxis2);

    });
}

function resizeHttpChart() {
    var chart = d3.select(".httpChart")
	chart.attr("width", httpWidth);
    x2 = d3.time.scale().range([0, httpGraphWidth]);
    xAxis2 = d3.svg.axis().scale(x2)
        .orient("bottom").ticks(3).tickFormat(d3.time.format("%H:%M:%S"));
}

updateHttpData()

setInterval(function() {
  request = "http://" + myurl + "/httpRequest";
     d3.json(request, function(error, data) {})
     request = "http://" + myurl + "/cpuRequest";
     d3.json(request, function(error, data) {})
     request = "http://" + myurl + "/memRequest";
     d3.json(request, function(error, data) {})
}, 2000);


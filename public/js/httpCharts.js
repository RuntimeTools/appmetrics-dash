            var x2 = d3.time.scale().range([0, width]);
            var y2 = d3.scale.linear().range([height, 0]);

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
                    return x2(d.time);
                })
                .y(function(d) {
                    return y2(d.duration);
                });

            var httpChart = d3.select("#httpDiv")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr("class", "httpChart")
                .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

            // Scale the range of the data
            x2.domain(d3.extent(httpData, function(d) {
                return d.time;
            }));
            y2.domain([0, httpMax]);

            // Add the systemline path.
            httpChart.append("path")
                .attr("class", "line")
                .attr("d", httpline(httpData));

            // Add the Latest Data
            httpChart.append("text")
                .attr("x", 0) // spacing
                .attr("y", 0 - (margin.top * 3 / 8))
                .attr("class", "max")
                .style("font-size", "32px");
            // .text(d3.format(",.2f")(httpMax) + "ms");

            // Add the X Axis
            httpChart.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis2);

            // Add the Y Axis
            httpChart.append("g")
                .attr("class", "y axis")
                .call(yAxis2);

            // Add the title
            httpChart.append("text")
                .attr("x", -20)
                .attr("y", 0 - (margin.top * 6 / 8))
                .attr("text-anchor", "left")
                .style("font-size", "18px")
                .text("HTTP Response Time");


   
function updateHttpData() {
    socket.on('http', function (httpRequest){
        data = JSON.parse(httpRequest);  // parses the data into a JSON array
         if (data.length == 0)
             return

                    var d = data;
                    if (!d.time)
                        d.time = new Date(+d.time);
                    d.responseTime = Math.round(+d.duration)
                    if (d.responseTime > httpMax)
                        httpMax = d.responseTime;
                    httpData.push(d)

                // Only keep 30 minutes of data
                var currentTime = Date.now()
                var d = httpData[0]
                while (d.time.valueOf() + 1800000 < currentTime) {
                    httpData.shift()
                    d = httpData[0]
                }

                // Scale the range of the data
                x2.domain(d3.extent(httpData, function(d) {
                    return d.time;
                }));
                y2.domain([0, httpMax]);

                var selection = d3.select(".httpChart").transition();

                selection.select(".line") // change the line
                    .duration(300)
                    .attr("d", httpline(httpData));
                selection.select(".x.axis") // change the x axis
                    .duration(300)
                    .call(xAxis2);
                selection.select(".y.axis") // change the y axis
                    .duration(300)
                    .call(yAxis2);
                selection.select(".max") // change the text
                    .delay(300)
                    .text(d3.format(",.2f")(httpMax) + "ms");

            });
}

updateHttpData();


setInterval(function() {
  request = "http://" + myurl + "/httpRequest";
     d3.json(request, function(error, data) {})
     request = "http://" + myurl + "/cpuRequest";
     d3.json(request, function(error, data) {})
     request = "http://" + myurl + "/memRequest";
     d3.json(request, function(error, data) {})
}, 2000);


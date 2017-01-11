var data = [];

var barHeight = height/5;

var barX = d3.scale.linear()
    .range([0, width]);


var urlChart = d3.select("#httpDiv")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "urlChart")
    .append("g")
        .attr("transform", 
              "translate(" + margin.left + "," + margin.top + ")");

// Add the title
urlChart.append("text")
    .attr("x", -20)
    .attr("y", 0 - (margin.top * 6 / 8))
    .attr("text-anchor", "left")
    .style("font-size", "18px")
    .text("Average Response Times (top 5)");

function convertURL(url) {
    if(url.toString().startsWith("http://" + myurl)) {
        return url.toString().substring(myurl.length + 7)
    }
}

function updateBars() {

    barX.domain([0, d3.max(data, function(d) { return d.averageResponseTime; })])

    var bars = d3.select(".urlChart").selectAll(".bar").remove();

    var bar = d3.select(".urlChart").selectAll(".bar")
        .data(data)
        .enter().append("g").attr("class", "bar")
        .attr("transform", function(d, i) { return "translate(50," + (margin.top + i * barHeight) + ")"; });

    // Background
    bar.append("rect")
        .attr("width", width)
        .attr("height", barHeight - 4)
        .style("fill", "#9fa7a7");

    bar.append("rect")
        .attr("width", function(d) { return barX(d.averageResponseTime); })
        .attr("height", barHeight - 4);

    bar.append("text")
        .attr("x", 2)
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) {            
            return convertURL(d.url)});

    bar.append("text")
        .attr("x", width -2)
        .attr("y", barHeight / 2)
        .attr("text-anchor", "end")
        .attr("dy", ".35em")
        .text(function(d) {            
            return d3.format(",.2f")(d.averageResponseTime) + "ms"; });
}

updateBars();

function updateHttpAverages(jsonData) {
    data = jsonData.sort(function (a, b) {
        if (a.averageResponseTime > b.averageResponseTime) {
            return -1;
        }
        if (a.averageResponseTime < b.averageResponseTime) {
            return 1;
        }
        // a must be equal to b
        return 0;
    });
    if(data.length > 5) {
        data = data.slice(0,5);
    }
    updateBars();
}

function updateURLData() {
	// Get the HTTP average response times
  socket.on('httpAverages', function (httpAverages){
    data = JSON.parse(httpAverages);  // parses the data into a JSON array
		updateHttpAverages(data);
	});
}

updateURLData();



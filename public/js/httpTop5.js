var data = [];

var barHeight = tallerHeight / 5;

var httpDiv3Width = $("#httpDiv3").width(),
    httpDiv3GraphWidth = httpDiv3Width - margin.left - margin.right;

var barX = d3.scale.linear()
    .range([0, httpDiv3GraphWidth]);


var urlChart = d3.select("#httpDiv3")
    .append("svg")
    .attr("width", httpDiv3Width)
    .attr("height", tallerHeight + margin.shortTop + margin.bottom)
    .attr("class", "urlChart")
    .append("g")
    .attr("transform", 
        "translate(" + margin.left + "," + margin.shortTop + ")");

// Add the title
urlChart.append("text")
    .attr("x", -20)
    .attr("y", 0 - (margin.shortTop * 0.5))
    .attr("text-anchor", "left")
    .style("font-size", "18px")
    .text("Average Response Times (top 5)");

function convertURL(url) {
    if (url.toString().startsWith("http://" + myurl)) {
        return url.toString().substring(myurl.length + 7)
    }
}

function updateBars() {

    barX.domain([0, d3.max(data, function(d) {
        return d.averageResponseTime;
    })])

    var bars = d3.select(".urlChart").selectAll(".bar").remove();

    var bar = d3.select(".urlChart").selectAll(".bar")
        .data(data)
        .enter().append("g").attr("class", "bar")
        .attr("transform", function(d, i) { 
            return "translate(50," + (margin.shortTop + i * barHeight) + ")";
        });

    // Background
    bar.append("rect")
        .attr("width", httpDiv3GraphWidth)
        .attr("height", barHeight - 4)
        .style("fill", "#9fa7a7");

    bar.append("rect")
        .attr("width", function(d) {
            return barX(d.averageResponseTime);
        })
        .attr("height", barHeight - 4);

    bar.append("text")
        .attr("x", 2)
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("fill", "white")
        .text(function(d) {            
            return convertURL(d.url)
        });

    bar.append("text")
        .attr("x", httpDiv3GraphWidth - 2)
        .attr("y", barHeight / 2)
        .attr("text-anchor", "end")
        .attr("fill", "white")
        .attr("dy", ".35em")
        .text(function(d) {
            return d3.format(",.2f")(d.averageResponseTime) + "ms";
        });
}

updateBars();

function updateHttpAverages(jsonData) {
    data = jsonData.sort(function(a, b) {
        if (a.averageResponseTime > b.averageResponseTime) {
            return -1;
        }
        if (a.averageResponseTime < b.averageResponseTime) {
            return 1;
        }
        // a must be equal to b
        return 0;
    });
    if (data.length > 5) {
        data = data.slice(0, 5);
    }
    updateBars();
}

function updateURLData() {
    // Get the HTTP average response times
    socket.on('httpAverages', function (httpRequest){
      data = JSON.parse(httpRequest);  // parses the data into a JSON array
       if (data.length == 0)
           return  

            if (data == null)
                return

            var urlTuple = data["url"];
                if (urlTuple != null) {
                    var averageResponseTime = urlTuple[0];
                    var hits = urlTuple[1];
                    // Recalculate the average
                    data["url"] = ((averageResponseTime * hits + data["duration"]) / (hits + 1), hits + 1);
                } else {
                    data["url"] = (data["duration"]);
                }

        updateHttpAverages(data);
    });
}

function resizeHttpTop5Chart() {
    httpDiv3Width = $("#httpDiv3").width(),
        httpDiv3GraphWidth = httpDiv3Width - margin.left - margin.right;
    barX = d3.scale.linear()
        .range([0, httpDiv3GraphWidth]);
    var chart = d3.select(".urlChart")
    chart.attr("width", httpDiv3Width);
    updateBars();
}



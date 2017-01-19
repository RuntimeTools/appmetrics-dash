
d3.select("#nodeReportButtonDiv")
	.append("input")
	.attr("name", "nodeReportButton")
    .attr("class", "btn btn-secondary btn-lg btn-block")
	.attr("type", "button")
	.attr("value", "Show NodeReport")
	.attr("onClick", "socket.emit('nodereport')");

socket.on('nodereport', function (nodereport){
    d3.select(".nodeReportText").remove();
    d3.select("#nodeReportDiv")
	    .append("pre")
        .attr("class", "nodeReportText")
        .style("padding-left", "45px")
        .style("padding-top", "20px")
        .text(nodereport);
    document.getElementById('nodeReportDiv').scrollIntoView(true);    
});

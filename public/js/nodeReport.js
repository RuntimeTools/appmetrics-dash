
d3.select("#nodeReportButtonDiv")
    .append("input")
    .attr("name", "nodeReportButton")
    .attr("class", "btn btn-secondary btn-lg")
    .attr("type", "button")
    .attr("value", "Show NodeReport")
    .style("background-color", "#eff3f5")
    .style("border", "2px solid #dbe6e9")
    .style("color", "#3b4b54")
    .attr("onClick", "socket.emit('nodereport')");

socket.on("nodereport", function(nodereport){
  var newWindow = window.open();
  newWindow.document.open();
    // XXX(sam) perhaps the errors should be formatted differently?
  nodereport = nodereport.error || nodereport.report;
  newWindow.document.write("<html><head><title>NodeReport: "
        + new Date().toUTCString()
        + "</title></head><body><pre style=\"white-space: pre-wrap;\">"
        + nodereport + "</pre></body></h‌​tml>");
  newWindow.document.close();
});

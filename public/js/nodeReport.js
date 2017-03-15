
d3.select("#nodeReportButtonDiv")
    .append("input")
    .attr("name", "nodeReportButton")
    .attr("class", "btn btn-secondary btn-lg")
    .attr("type", "button")
    .attr("value", "Generate Node Report")
    .style("background-color", "#eff3f5")
    .style("border", "2px solid #dbe6e9")
    .style("color", "#3b4b54")
    .attr("onClick", "socket.emit('nodereport')");

d3.select("#nodeReportButtonDiv")
    .append("input")
    .attr("name", "heapdumpButton")
    .attr("class", "btn btn-secondary btn-lg")
    .attr("type", "button")
    .attr("value", "Generate Heap Snapshot")
    .style("background-color", "#eff3f5")
    .style("border", "2px solid #dbe6e9")
    .style("color", "#3b4b54")
    .attr("onClick", "socket.emit('heapdump')");

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

socket.on("heapdump", function(info){
  var text = "Heap snapshot generated at " + info.location;
  if(info.error) {
    text = "An error occurred: " + info.error;
  }
  d3.select(".modal-body").select(".modaltext").remove()
  d3.select(".modal-body").append("p")
    .attr("class", "modaltext").text(text)
  $('#heapdumpModal').modal('show')
});

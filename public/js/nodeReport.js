
d3.select("#nodeReportButtonDiv")
	.append("input")
	.attr("name", "nodeReportButton")
    .attr("class", "btn btn-secondary btn-lg btn-block")
	.attr("type", "button")
	.attr("value", "Show NodeReport")
	.attr("onClick", "socket.emit('nodereport')");

socket.on('nodereport', function (nodereport){
    var newWindow = window.open();
    newWindow.document.open();
    newWindow.document.write('<html><head><title>NodeReport: '
        + new Date().toUTCString()
        + '</title></head><body><pre style="white-space: pre-wrap;">'
        + nodereport + '</pre></body></h‌​tml>');
    newWindow.document.close();  
});

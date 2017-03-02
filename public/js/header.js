
//d3.select('.leftHeader').text('Application Metrics for Node.js Dashboard')
//d3.select('.rightHeader').text('Go To Documentation')

socket.on('title', function (data){
    var titleAndDocs = JSON.parse(data);
    if(titleAndDocs.hasOwnProperty('title'))
        d3.select('.leftHeader').text(titleAndDocs.title)
    if(titleAndDocs.hasOwnProperty('docs'))
        d3.select('.rightHeader').append("a").attr("href", titleAndDocs.docs).text("Go To Documentation");
});


function updateCPUData() {
 // var processCPULatest = 0;
 // var systemCPULatest = 0;

	// Get the data again
  socket.on('cpu', function (cpuRequest){
    data = JSON.parse(cpuRequest);  // parses the data into a JSON array  
		if (data.length == 0)
			return

			var d = data;
			d.time = new Date(+d.time);
			d.system = +d.system * 100;
			d.process = +d.process * 100;
			processCPULatest = Math.round(d.process);
			systemCPULatest = Math.round(d.system);
			// Update gauges
			updateCpuProcessGauge(processCPULatest);
			cpuData.push(d)
		

		// Only keep 30 minutes of data
		var currentTime = Date.now()
		var d = cpuData[0]
		while (d.time.valueOf() + 1800000 < currentTime) {
		  cpuData.shift()
			d = cpuData[0]
		}

		// Scale the range of the data again
		x.domain(d3.extent(cpuData, function(d) {
			return d.time;
		}));

		// Select the section we want to apply our changes to
		var selection = d3.select(".cpuChart").transition();

                // Make the changes
		selection.select(".line1") // change the line
			.duration(750)
			.attr("d", systemline(cpuData));
		selection.select(".line2") // change the line
			.duration(750)
			.attr("d", processline(cpuData));
		selection.select(".x.axis") // change the x axis
			.duration(750)
			.call(xAxis);
		selection.select(".y.axis") // change the y axis
			.duration(750)
			.call(yAxis);
		selection.select(".processCPUlatest") // change the text
			.delay(750)
			.text(processCPULatest + "%");
		selection.select(".systemCPUlatest") // change the text
			.delay(750)
			.text(systemCPULatest + "%");
	});
}

function updateMemData() {
  //var processMEMLatest = 0;
  //var systemMEMLatest = 0;
	// Get the data again
  socket.on('memory', function (memRequest){
    data = JSON.parse(memRequest);  // parses the data into a JSON array  
  
		if (data.length == 0)
			return
			var d = data;
			d.time = new Date(+d.time);
			d.physical_used  = +d.physical_used  / (1024 * 1024);
			d.physical  = +d.physical  / (1024 * 1024);
				processMEMLatest = Math.round(d.physical );
				//update gauges
				updateMemProcessGauge(d.physical);
				systemMEMLatest = Math.round(d.physical_used);
			memData.push(d)
		

		// Only keep 30 minutes of data
		var currentTime = Date.now()
		var d = memData[0]
		while (d.time.valueOf() + 1800000 < currentTime) {
			memData.shift()
			d = memData[0]
		}

		// Scale the range of the data again
		mem_x.domain(d3.extent(memData, function(d) {
			return d.time;
		}));
		mem_y.domain([0, Math.ceil(d3.extent(memData, function(d) {
			return d.physical_used;
		})[1] / 100) * 100]);

		// Select the section we want to apply our changes to
		var selection = d3.select(".memChart").transition();

		// Make the changes
		selection.select(".line1") // change the line
			.duration(750)
			.attr("d", mem_system_line(memData));
		selection.select(".line2") // change the line
			.duration(750)
			.attr("d", mem_process_line(memData));
		selection.select(".x.axis") // change the x axis
			.duration(750)
			.call(mem_xAxis);
		selection.select(".y.axis") // change the y axis
			.duration(750)
			.call(mem_yAxis);
		selection.select(".processMEMlatest") // change the text
			.delay(750)
			.text(processMEMLatest + "MB");
		selection.select(".systemMEMlatest") // change the text
			.delay(750)
			.text(systemMEMLatest + "MB");
	});
}

updateCPUData();
updateMemData();




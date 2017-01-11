var cpuProcessGauge;

function onDocumentReadyCPUProcess() {
	cpuProcessGauge = gauge('#cpuDiv', {
		maxValue: 100,
		title : "Process CPU (%)"
	});
	cpuProcessGauge.render();
}

if ( !window.isLoaded ) {
	window.addEventListener("load", function() {
		onDocumentReadyCPUProcess();
	}, false);
} else {
	onDocumentReadyCPUProcess();
}

function updateCpuProcessGauge(process) {
    if(cpuProcessGauge) {
	    cpuProcessGauge.update(process);
    }
}

var memProcessGauge;

function onDocumentReadyMemProcess() {
	memProcessGauge = gauge('#memDiv', {
		maxValue: 200,
		title: "App Memory Used (MB)",
		titleFontSize: "18px"
	});
	memProcessGauge.render();
}

if ( !window.isLoaded ) {
	window.addEventListener("load", function() {
		onDocumentReadyMemProcess();
	}, false);
} else {
	onDocumentReadyMemProcess();
}

function updateMemProcessGauge(process) {
    if(memProcessGauge) {
	    memProcessGauge.update(process);
    }
}

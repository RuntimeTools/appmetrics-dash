var memPhysicalGauge;

function onDocumentReadyMemPhysical() {
	memPhysicalGauge = gauge('#mem-gauges', {
		size: 400,
		clipWidth: 430,
		clipHeight: 250,
		ringWidth: 55,
		maxValue: 200,
		transitionMs: 3000,
	});
	memPhysicalGauge.render();
}

if ( !window.isLoaded ) {
	window.addEventListener("load", function() {
		onDocumentReadyMemPhysical();
	}, false);
} else {
	onDocumentReadyMemPhysical();
}

function updateMemPhysicalGauge(physical) {
    if(memPhysicalGauge) {
	    memPhysicalGauge.update(physical);
    }
}

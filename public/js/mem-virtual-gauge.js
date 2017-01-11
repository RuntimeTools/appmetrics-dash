var memVirtualGauge;

function onDocumentReadyMemVirtual() {
	memVirtualGauge = gauge('#mem-gauges', {
	        size: 400,
		clipWidth: 430,
		clipHeight: 250,
		ringWidth: 55,
		maxValue: 1000,
		transitionMs: 3000,
	});
	memVirtualGauge.render();
}

if ( !window.isLoaded ) {
	window.addEventListener("load", function() {
		onDocumentReadyMemVirtual();
	}, false);
} else {
	onDocumentReadyMemVirtual();
}

function updateMemVirtualGauge(virtual) {
    if(memVirtualGauge) {
	    memVirtualGauge.update(virtual);
    }
}

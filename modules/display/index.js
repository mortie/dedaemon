var udev = require("udev");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

var monitor;

function onchange(dev, evt) {
	if (evt === "add")
		logger.info("display added");
	else if (evt === "change")
		logger.info("display changed");
	else
		logger.info(dev);

	//modules.wallpaper.event("reload");
}

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	monitor = udev.monitor("drm");
	monitor.on("add", dev => onchange(dev, "add"));
	monitor.on("change", dev => onchange(dev, "change"));
}

function stop(cb) {
	cb();
}

function event(name, ...params) {
	switch (name) {
	default:
		logger.warn("Unknown event:", name);
	}
}

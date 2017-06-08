var udev = require("../../udev");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

function onchange(dev) {
	if (dev.ACTION === "add")
		logger.info("display added");
	else if (dev.ACTION === "change")
		logger.info("display changed");
	else
		logger.info(dev);

	//modules.wallpaper.event("reload");
}

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	udev.monitor("drm", onchange);
}

function stop(cb) {
	udev.unmonitor("drm", onchange);
	cb();
}

function event(name, ...params) {
	switch (name) {
	default:
		logger.warn("Unknown event:", name);
	}
}

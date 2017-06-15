var udev = require("../../udev");
var xrandr = require("./xrandr");
var table = require("../../js/table");
var spawn = require("child_process").spawn;

exports.start = start;
exports.stop = stop;
exports.event = event;
exports.list = list;

var conf;
var logger;
var modules;

function findMode(display, mode) {
	if (mode === "max")
		return display.modes[0];

	for (var i in display.modes) {
		if (display.modes[i].resStr == mode)
			return display.modes[i];
	}

	return null;
}

function findRate(mode, rate) {
	if (rate === "max")
		return mode.rates[0];

	for (var i in mode.rates) {
		if (mode.rates[i] == rate)
			return mode.rates[i];
	}

	return null;
}

function randr(args) {
	var cmd = "xrandr";

	var child = spawn(cmd, args);
	child.stderr.on("data", d => logger.warn("xrandr:", d.toString()));
}

function turnOff(display) {
	var args = [
		"--output", display.id,
		"--off"
	];

	randr(args);
}

function applyRule(primary, rule, display) {
	var args = [ "--output", display.id ];

	if (rule.rate != null && rule.mode == null)
		return logger.warn("Display "+rule.name+": 'rate' specified without 'mode'");

	var mode;
	if (rule.mode != null) {
		mode = findMode(display, rule.mode);
		if (mode == null)
			return logger.warn(
				"Display "+rule.name+": Invalid mode: "+rule.res);

		args.push("--mode");
		args.push(mode.resStr);
	}

	var rate;
	if (rule.rate != null) {
		rate = findRate(mode, rule.rate);
		if (rate == null)
			return logger.warn(
				"Display "+rule.name+": Invalid rate: "+rule.rate);

		args.push("--rate");
		args.push(rate);
	}

	if (rule.where) {
		var w = rule.where;
		for (var i in w) {
			if (
					i !== "left-of" && i !== "right-of" && 
					i !== "above" && i !== "below") {
				return logger.warn(
					"Display "+rule.name+": Invalid 'where' value: "+i);
			}

			if (w[i] === "primary" && display === primary)
				continue;

			var id;
			if (w[i] === "primary") {
				id = primary.id;
			} else {
				id = w[i];
			}

			args.push("--"+i);
			args.push(id);
		}
	}

	randr(args);
}

function onchange() {
	if (conf == null) {
		setTimeout(() => modules.wallpaper.event("reload"), 0);
		logger.info("No displays configured.");
		return;
	}

	xrandr.list(data => {

		// Trun off all disconnected displays
		data.displays.filter(d => !d.connected).forEach(turnOff);

		var displays = data.displays.filter(d => d.connected);
		var primary = displays.filter(d => d.primary)[0];

		conf.forEach(entry => {
			displays.forEach(disp => {
				if (entry.name !== "*" && entry.name !== disp.id)
					return;

				applyRule(primary, entry, disp);
			});
		});

		setTimeout(() => modules.wallpaper.event("reload"), 400);
	});
}

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	onchange();
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

function list(cb) {
	xrandr.list(devs => {
		devs.displays.forEach(dev => {
			console.error(
				"\tname: "+dev.id+
				(dev.connected ? ", connected" : "")+
				(dev.primary ? ", primary" : ""));

			var data = [];
			for (var i in dev.modes) {
				var mode = dev.modes[i];
				data[i] = [];
				var d = data[i];
				d.push("mode: "+mode.resStr+",");
				d.push("rate:");
				mode.rates.forEach(r => d.push(r));
			}

			table(console.error.bind(console), data, "\t\t");
		});
		cb();
	});
}

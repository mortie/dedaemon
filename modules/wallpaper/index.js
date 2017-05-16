var spawn = require("child_process").spawn;
var fs = require("fs");
var pathlib = require("path");

var debounce = require("../../js/debounce");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

function runFeh() {
	var mode;
	logger.info("Setting background to", conf.path);

	switch (conf.mode) {
	case "scale":
	case undefined:
		mode = "--bg-scale";
		break;

	case "center":
		mode = "--bg-center";
		break;

	case "fill":
		mode = "--bg-fill";
		break;

	case "max":
		mode = "--bg-max";
		break;

	case "tile":
		mode = "--bg-tile";
		break;

	default:
		return logger.error("Invalid mode: "+conf.mode);
	}

	var child = spawn("feh", [ mode, conf.path ]);

	child.stdout.on("data", d =>
		logger.info("feh stdout:", d.toString().trim()));
	child.stderr.on("data", d =>
		logger.info("feh stderr:", d.toString().trim()));
}

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	if (!conf.path)
		return logger.error("Expected conf.path");

	runFeh();

	var dirname = pathlib.dirname(conf.path);
	var basename = pathlib.basename(conf.path);

	var run = debounce(runFeh);

	fs.watch(dirname, (type, name) => {
		if (name !== basename)
			return;

		run();
	});
}

function stop(cb) {
	cb();
}

function event(name, ...params) {
	logger.info("Event", name, params.toString());

	switch (name) {
	case "reload":
		runFeh();
		break;
	}
}

#!/usr/bin/env node

var syscheck = require("./js/syscheck");
var parseConf = require("./js/parse-conf");
var async = require("./js/async");

var modules = {
//	display: require("./modules/display"),
	input: require("./modules/input"),
	wallpaper: require("./modules/wallpaper"),
	process: require("./modules/process"),
};

if (!process.argv[2]) {
	console.log("Usage:", process.argv[1], "<config>");
	process.exit(1);
}

var config = parseConf(process.argv[2]);

function createLogger(name) {
	function log(pre, msg) {
		console.error(pre+msg.join(" "));
	}

	return {
		info: (...msg) => log(name+": INFO: ", msg),
		warn: (...msg) => log(name+": WARNING: ", msg),
		error: (...msg) => log(name+": ERROR: ", msg),
	}
}

function startAll() {
	Object.keys(modules).forEach(i => {
		var mod = modules[i];
		var conf = config[i] || {};

		if (conf instanceof Array && conf.length === 0)
			return;

		mod.start(conf, createLogger(i), modules);
	});
}

function stopAll(cb) {
	var keys = Object.keys(modules);
	var next = async(keys.length, cb);
	keys.forEach(i => modules[i].stop(next));
}

function onTerm() {
	stopAll(() => process.exit(1));
}

syscheck(ok => {
	if (ok)
		startAll();
	else
		console.error("Missing binaries, exiting.");
});

process.on("SIGTERM", onTerm);
process.on("SIGINT", onTerm);

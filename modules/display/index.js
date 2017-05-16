exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;
}

function stop(cb) {
	cb();
}

function event(name, ...params) {
	logger.info("Event", name, params.toString());
}

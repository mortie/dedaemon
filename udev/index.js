var spawn = require("child_process").spawn;

exports.list = list;
exports.monitor = monitor;
exports.unmonitor = unmonitor;
exports.exit = exit;
exports.init = init;

var child;

function init(cb) {
	child = spawn(__dirname+"/udev-monitor");

	var currstr = "";
	child.stdout.setEncoding("utf8");
	child.stdout.on("data", d => {
		var lines = d.toString().split("\n");

		currstr += lines[0];
		if (lines.length === 1)
			return;

		ondata(JSON.parse(currstr));

		for (var i = 1; i < lines.length -1; ++i) {
			ondata(JSON.parse(lines[i]));
		}

		currstr = lines[lines.length - 1];
	});
	child.stderr.on("data", d => console.error("udev error:", d.toString()));
}

var listq = [];
var monitors = {};

function ondata(obj) {
	if (obj instanceof Array) {
		if (listq.length === 0)
			return;
		var cb = listq.shift();
		cb(obj);
	} else {
		var ss = obj.SUBSYSTEM;
		if (monitors[ss]) {
			monitors[ss].forEach(cb => cb(obj));
		}
		if (monitors["*"]) {
			monitors["*"].forEach(cb => cb(obj));
		}
	}
}

function list(ss, cb) {
	listq.push(cb);
	child.stdin.write("list:"+ss+"\n");
}

function monitor(ss, cb) {
	if (monitors[ss] == null) {
		child.stdin.write("monitor:"+ss+"\n");
		monitors[ss] = [];
	}

	monitors[ss].push(cb);
}

function unmonitor(ss, cb) {
	if (monitors[ss] == null)
		throw new Error("Callback function for "+ss+" not registered");

	var removed = false;
	for (var i in monitors[ss]) {
		if (monitors[ss][i] === cb) {
			monitors[ss].splice(i, 1);
			removed = true;
		}
	}
}

function exit() {
	child.kill("SIGTERM");
}

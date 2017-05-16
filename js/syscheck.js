var spawn = require("child_process").spawn;

module.exports = check;

var needed = [
	"feh",
];

function need(str, cb) {
	var child = spawn("which", [ str ]);
	child.on("close", code => {
		if (code === 0) {
			cb(true);
		} else {
			console.error("Missing system binary:", str);
			cb(false);
		}
	});
}

function check(cb) {
	var ok = true;
	var cbs = needed.length;
	function next(res) {
		if (!res)
			ok = false;

		cbs -= 1;
		if (cbs === 0)
			cb(ok);
	}

	needed.forEach(s => need(s, next));
}

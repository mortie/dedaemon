var syscheck = require("./js/syscheck");

var modules = {
	display: require("./modules/display"),
	input: require("./modules/input"),
	wallpaper: require("./modules/wallpaper")
};

var config = {
	display: [
		{
			name: "*",
			resolution: "max",
			rate: "max",
			where: { left_of: "primary" },
		},
	],

	input: [
		{
			type: "pointer",
			name: "*",
			options: [,
				[ "libinput Tapping Enabled", 1 ],
			],
		},

		{
			type: "pointer",
			name: "Razer Razer Naga",
			options: [
				[ "libinput Accel Speed", "-0.8" ],
			],
		},

		{
			type: "keyboard",
			name: "*",
			commands: [
				"xset r rate 200 60",
				"setxkbmap dvorak -option ctrl:swapcaps -option altwin:swap_alt_win",
			],
		},
	],

	wallpaper: {
		path: "/home/martin/background.jpg",
	},
}

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

		mod.start(conf, createLogger(i), modules);
	});
}

function stopAll(cb) {
	var keys = Object.keys(modules);

	var cbs = keys.length;
	function next() {
		cbs -= 1;
		if (cbs === 0)
			cb();
	}

	keys.forEach(i => modules.stop(next));
}

syscheck(ok => {
	if (ok)
		startAll();
	else
		console.error("Missing binaries, exiting.");
});

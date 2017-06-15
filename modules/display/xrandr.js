var spawn = require("child_process").spawn;

exports.list = list;

function parseScreen(line) {
	var rxId = /Screen (\d+)/;
	var rxMin = /minimum (\d+) x (\d+)/;
	var rxCurr = /current (\d+) x (\d+)/;
	var rxMax = /maximum (\d+) x (\d+)/;

	var id = line.match(rxId);
	var min = line.match(rxMin);
	var curr = line.match(rxCurr);
	var max = line.match(rxMax);
	return {
		id: parseInt(id[1]),
		minimum: {
			w: parseInt(min[1]),
			h: parseInt(min[2]),
		},
		current: {
			w: parseInt(curr[1]),
			h: parseInt(curr[2]),
		},
		maximum: {
			w: parseInt(max[1]),
			h: parseInt(max[2]),
		},
	};
}

function parseDisplayMode(line) {
	var rxResStr = /(\d+x\d+[^\s]+)/;
	var rxRes = /(\d+)x(\d+)/;
	var rxRate = /(\d+\.\d+)/;

	var obj = {};

	var resStr = line.match(rxResStr);
	obj.resStr = resStr[1];
	var res = line.match(rxRes);
	obj.res = { w: parseInt(res[1]), h: parseInt(res[2]) };

	line = line.substr(res.index + res[0].length);
	obj.rates = [];

	while (true) {
		var rate = line.match(rxRate);
		if (rate === null)
			break;

		obj.rates.push(rate[1]);
		line = line.substr(rate.index + rate[0].length);
	}

	return obj;
}

function parseDisplayModes(lines) {
	var modes = [];
	for (var i = 1; i < lines.length; ++i) {
		modes.push(parseDisplayMode(lines[i]));
	}
	return modes;
}

function parseDisplayStart(line) {
	var rxId = /^([^ ]+)/;
	var rxPrimary = /primary/;
	var rxConnected = /(connected|disconnected)/;
	var rxRes = /(\d+)x(\d+)\+(\d+)\+(\d+)/;
	var rxDims = /(\d+)mm x (\d+)mm/;

	var id = line.match(rxId);
	var primary = line.match(rxPrimary);
	var connected = line.match(rxConnected)[1] === "connected";
	var res = line.match(rxRes);
	var dims = line.match(rxDims);

	return {
		id: id[1],
		primary: primary ? true : false,
		connected: connected,
		res: (res == null ? null : {
			w: parseInt(res[1]),
			h: parseInt(res[2]),
			x: parseInt(res[3]),
			y: parseInt(res[4]),
		}),
		dims: (res == null ? null : {
			w: parseInt(dims[1]),
			h: parseInt(dims[2]),
		}),
	}
}

function parseDisplay(lines) {
	var obj = parseDisplayStart(lines[0]);
	if (obj.connected)
		obj.modes = parseDisplayModes(lines);
	return obj;
}

function parse(str) {
	var strings = [];
	var lines = str.split("\n");

	var screens = [];
	var displays = [];

	var currArr;
	for (var i in lines) {
		var line = lines[i];
		if (line === "")
			continue;

		if (line.indexOf("Screen") === 0) {
			screens.push(parseScreen(line));
		} else if (line[0] !== " " && line[0] !== "\t") {
			if (currArr) {
				displays.push(parseDisplay(currArr));
			}
			currArr = [line];
		} else {
			currArr.push(line);
		}
	}

	if (currArr) {
		displays.push(parseDisplay(currArr));
	}

	return {
		screens: screens,
		displays: displays.filter(d => d != null),
	}
}

function list(cb) {
	var child = spawn("xrandr", [ "--query" ]);

	var output = "";
	child.stdout.on("data", d => output += d);

	child.on("close", () => {
		var devs = parse(output);
		cb(devs);
	});
}

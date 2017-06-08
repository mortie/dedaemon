var udev = require("../../udev");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;

var debounce = require("../../js/debounce");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

// Set an xinput property
function setProp(name, val, suppressWarnings) {
	var args = [ "--set-prop", name ];
	val.forEach(v => args.push(v));

	// We need to wait for X to recognize the device
	setTimeout(function() {
		var child = spawn("xinput", args)
		child.on("close", code => {
			if (code !== 0 && !suppressWarnings)
				logger.warn("Xinput command failed:", args.join(", "));
		});

		if (!suppressWarnings) {
			child.stderr.on("data", d => {
				logger.warn(
					"Xinput command for", name, "failed:",
					d.toString().trim());
			});
		}
	}, 500);
}

// Queued commands will be run once runCmds is called
var queuedCmds = [];
function queueCmd(command) {
	if (queuedCmds.indexOf(command) === -1)
		queuedCmds.push(command);
}

// Run queued commands, debounced
var runCmds = debounce(function() {
	queuedCmds.forEach(cmd => {
		var child = exec(cmd);
		child.on("close", code => {
			if (code !== 0)
				logger.warn("Command failed:", cmd);
		});
	});

	queuedCmds = [];
});

// Devices which aren't keyboards or mice with names aren't interesting
function filter(dev) {
	return dev.NAME &&
		(dev.ID_INPUT_KEYBOARD || dev.ID_INPUT_MOUSE || dev.ID_INPUT_TOUCHPAD);
}

// name can be either an array or a string
function nameMatches(dev, name) {

	// Remove quotes form device name
	var devname = dev.NAME.substring(1, dev.NAME.length - 1);

	if (typeof name === "string") {
		if (name !== "*" && name !== devname)
			return false;
	} else if (name instanceof Array) {
		var matched = false;
		for (var i in name) {
			if (name === devname) {
				matched = true;
				break;
			}
		}
		if (!matched)
			return false;
	} else {
		logger.warning("Expected name to be string or array");
		return false;
	}

	return true;
}

function onchange(dev) {
	if (!filter(dev))
		return;

	var isKeyboard = !!dev.ID_INPUT_KEYBOARD;
	var isPointer = !!(dev.ID_INPUT_MOUSE || dev.ID_INPUT_TOUCHPAD);

	// Find out what to log
	var inputType;
	if (isKeyboard && isPointer)
		inputType = "keyboard/pointer";
	else if (isKeyboard)
		inputType = "keyboard";
	else if (isPointer)
		inputType = "mouse";

	// Log add/change
	if (dev.ACTION === "add")
		logger.info(inputType, dev.NAME, "added");
	else if (dev.ACTION === "change")
		logger.info(inputType, dev.NAME, "changed");

	// Run through and apply relevant rules
	conf.forEach(entry => {
		if (entry.type === "pointer" && !isPointer)
			return;
		if (entry.type === "keyboard" && !isKeyboard)
			return;
		if (!nameMatches(dev, entry.name))
			return;

		// Add pointer: or keyboard: to name, and remove quotes
		var name = dev.NAME.substring(1, dev.NAME.length - 1);
		if (entry.type === "pointer")
			name = "pointer:"+name;
		else if (entry.type === "keyboard")
			name = "keyboard:"+name
		else
			return log.error("Invalid input type: "+entry.type);

		// If the entry matches everything, we don't need to print xinput warnings
		var suppressWarnings = entry.name === "*";

		// Set xinput options
		if (entry.options)
			entry.options.forEach(prop => setProp(name, prop, suppressWarnings));

		// Run commands
		if (entry.commands)
			entry.commands.forEach(queueCmd);
	});

	// Run queued commands
	runCmds();
}

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	udev.list("input", devs => devs.forEach(onchange))
	udev.monitor("input", onchange);
}

function stop(cb) {
	udev.unmonitor("input", onchange);
	cb();
}

function event(name, ...params) {
	switch (name) {
	default:
		logger.warn("Unknown event: "+name);
	}
}

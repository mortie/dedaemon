var udev = require("udev");
var spawn = require("child_process").spawn;
var exec = require("child_process").exec;

var debounce = require("../../js/debounce");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

var monitor;

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
	return dev.NAME && dev.SUBSYSTEM === "input" &&
		(dev.ID_INPUT_KEYBOARD || dev.ID_INPUT_MOUSE);
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

function onchange(dev, evt) {
	if (!filter(dev))
		return;

	// Find out what to log
	var inputType;
	if (dev.ID_INPUT_KEYBOARD && dev.ID_INPUT_MOUSE)
		inputType = "keyboard/mouse";
	else if (dev.ID_INPUT_KEYBOARD)
		inputType = "keyboard";
	else if (dev.ID_INPUT_MOUSE)
		inputType = "mouse";

	// Log add/change
	if (evt === "add")
		logger.info(inputType, dev.NAME, "added");
	else if (evt === "change")
		logger.info(inputType, dev.NAME, "changed");

	// Run through and apply relevant rules
	conf.forEach(entry => {
		if (entry.type === "pointer" && !dev.ID_INPUT_MOUSE)
			return;
		if (entry.type === "keyboard" && !dev.ID_INPUT_KEYBOARD)
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

	udev.list().forEach(dev => onchange(dev, "init"));

	monitor = udev.monitor();
	monitor.on("add", dev => onchange(dev, "add"));
	monitor.on("change", dev => onchange(dev, "change"));
}

function stop(cb) {
	monitor.close();
	cb();
}

function event(name, ...params) {
	logger.info("Event", name, params.toString());
}

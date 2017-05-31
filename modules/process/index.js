var spawn = require("child_process").spawn;
var async = require("../../js/async");

exports.start = start;
exports.stop = stop;
exports.event = event;

var conf;
var logger;
var modules;

class Process {
	constructor(id, cmd, options) {
		this.id = id;
		this.restart = options.restart;
		this.stopping = false;
		this.running = false;
		this.restarts = 0;

		this.name = cmd[0];
		cmd.shift();
		this.args = cmd;
		this.childOpts = {
			env: options.env,
			cwd: options.cwd,
		};

		this.info = logger.info.bind(logger, this.id+":");
		this.warn = logger.warn.bind(logger, this.id+":");
	}

	logOutput(stream, data) {
		data.toString()
			.split("\n")
			.map(line => line.trim())
			.forEach(line => {
				if (line === "") return;
				this.info(stream+":", line);
			});
	}

	onexit() {
		if (!this.restart)
			return;

		if (this.restarts < 2) {
			this.restarts += 1;
			var restarts = this.restarts;
			this.info("Restarting in 2 seconds.");
			setTimeout(() => {
				this.start();
				this.restarts = restarts;
			}, 2000);
		} else {
			this.warn("Not restarting anymore after 2 restarts.");
		}
	}

	start() {
		this.stopping = false;
		this.running = true;
		this.restarts = 0;

		this.child = spawn(this.name, this.args, this.childOpts);

		this.child.stdout.on("data",
			d => this.logOutput("stdout", d));
		this.child.stderr.on("data",
			d => this.logOutput("stderr", d));

		this.child.once("error", err => {
			if (!this.stopping)
				this.warn("Failed to start:", err);

			this.onexit();
		});
		this.child.once("close", code => {
			this.running = false;
			if (this.stopping)
				return;

			if (code === 0)
				this.info("Exited with status code 0");
			else
				this.warn("Exited with status code", code);
			this.onexit();
		});
	}

	stop(cb) {
		this.stopping = true;
		if (!this.running)
			return cb();

		this.info("Sending SIGTERM.");
		this.child.kill("SIGTERM");

		setTimeout(() => {
			if (this.running) {
				this.info("Sending SIGKILL.");
				this.child.kill("SIGKILL");
			}

			this.stopping = false;
			cb();
		}, 1000);
	}
}

class ProcessGroup {
	constructor(id, cmds, options) {
		this.procs = [];
		cmds.forEach(cmd => {
			var name = cmd[0];
			this.procs.push(new Process(id+"("+name+")", cmd, options));
		});
	}

	start() {
		this.procs.forEach(p => p.start());
	}

	stop(cb) {
		this.stopping = true;
		var next = async(this.procs.length, () => {
			this.stopping = false;
			cb();
		});
		this.procs.forEach(p => p.stop(next));
	}
}

var procs = {};

function start(conf_, logger_, modules_) {
	conf = conf_ || conf;
	logger = logger_ || logger;
	modules = modules_ || modules;

	conf.forEach(proc => {
		if (procs[proc.name])
			return logger.warn("Igonring duplicate process: "+proc.name);

		var env = null;
		if (proc.env) {
			env = {};
			for (var i in process.env) {
				env[i] = process.env[i];
			}
			for (var i in proc.env) {
				env[i] = proc.env[i];
			}
		}

		var opts = {
			cwd: proc.in,
			env: env,
			restart: !!proc.restart,
		};

		var p;
		if (!proc.as || proc.as === "process") {
			p = new Process(proc.name, proc.run, opts);
		} else if (proc.as === "group") {
			p = new ProcessGroup(proc.name, proc.run, opts);
		} else {
			return logger.warn(
				proc.name+":",
				"Invalid 'as' attribute:",
				proc.as);
		}

		procs[proc.name] = p;

		if (proc.delay != null) {
			setTimeout(() => {
				if (!p.stopping)
					p.start();
			}, proc.delay);
		} else {
			p.start();
		}
	});
}

function stop(cb) {
	var keys = Object.keys(procs);
	var next = async(keys.length, cb);
	keys.forEach(i => procs[i].stop(next));
}

function event(name, ...params) {
	switch (name) {
	default:
		logger.warn("Unknown event: "+name);
	}
}

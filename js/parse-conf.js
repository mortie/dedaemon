var hconfig = require("hconfig");

module.exports = parse;

var configStructure = {
	general: {
		count: "once",
		props: {
			log: "string",
		},
	},
	display: {
		count: "many",
		props: {
			name: "string",
			mode: "string",
			rate: "string",
			where: "object",
		},
	},
	input: {
		count: "many",
		props: {
			name: "string",
			type: "string",
			commands: "array",
			options: "array",
		},
	},
	wallpaper: {
		count: "once",
		props: {
			name: "null",
			path: "string",
			mode: [ "string", "null" ],
		},
	},
	process: {
		count: "many",
		props: {
			name: "string",
			run: "array",
			"in": [ "string", "null" ],
			env: [ "object", "null" ],
			restart: "bool",
			as: [ "string", "null" ],
			delay: [ "number", "null" ],
		},
	},
}

function parse(file) {
	try {
		return hconfig.parseConfFile(
			file, configStructure);
	} catch (err) {
		if (err.hconfigParseError) {
			console.error(err.message);
			process.exit(1);
		} else {
			throw err;
		}
	}
}

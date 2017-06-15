module.exports = table;

function table(log, data, pre, sep) {
	var sep = sep || " ";
	pre = pre || "";

	var lengths = [];

	var i = 0;
	while (true) {
		var longest = -1;
		for (var j in data) {
			var d = data[j];
			if (d[i] == null)
				continue;

			if (d[i].length > longest)
				longest = d[i].length;
		}
		if (longest === -1)
			break;
		else
			lengths[i] = longest;
		i += 1;
	}

	for (var i in data) {
		var d = data[i];
		var str = "";
		for (var j in d) {
			var s = d[j];
			var len = lengths[j];

			str +=
				s +
				(j == d.length - 1 ? "" : sep) +
				new Array(len - s.length + 1).join(" ");
		}
		log(pre+str);
	}
}

module.exports = debounce;

function debounce(fn, ms) {
	if (ms == null)
		ms = 100;

	var timeout = null;
	return function() {
		if (timeout != null)
			clearTimeout(timeout);

		timeout = setTimeout(fn, ms);
	}
}

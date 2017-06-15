module.exports = async;

function async(num, cb) {
	if (num === 0)
		return cb();

	return function() {
		num -= 1;
		if (num === 0)
			cb();
	}
}

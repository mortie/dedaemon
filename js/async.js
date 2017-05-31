module.exports = async;

function async(num, cb) {
	return function() {
		num -= 1;
		if (num === 0)
			cb();
	}
}

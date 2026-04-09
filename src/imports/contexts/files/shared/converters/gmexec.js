export const gmexec = function gmexec(thisObj, fct, ...args) {
	return new Promise((resolve, reject) => {
		args.push((err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
		});
		fct.call(thisObj, ...args);
	});
};

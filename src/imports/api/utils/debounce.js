/**
 * es6+ version of underscore debounce replacement
 * @see https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore?tab=readme-ov-file#_debounce
 * @param func
 * @param wait
 * @param immediate
 * @return {(function(...[*]): void)|*}
 */
export const debounce = (func, wait, immediate = false) => {
	let timeout;
	// keep fn bindable
	return function (...args) {
		clearTimeout(timeout);
		if (immediate && !timeout) {
			func.apply(this, args);
		}
		timeout = setTimeout(() => {
			timeout = null;
			if (!immediate) {
				func.apply(this, args);
			}
		}, wait);
	};
};

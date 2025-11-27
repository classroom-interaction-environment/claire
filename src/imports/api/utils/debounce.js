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
    let context = this
    clearTimeout(timeout);
    if (immediate && !timeout) {
      func.apply(context, args);
    }
    timeout = setTimeout(function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    }, wait);
  };
}

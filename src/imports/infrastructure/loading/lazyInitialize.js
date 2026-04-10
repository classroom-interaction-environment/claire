/**
 * Allows to lazy import/require and prevent
 * circular dependencies or errors due to unresolved deps.
 *
 * @param loadFunction
 * @return {function(...[*]): *}
 */
export const lazyInitialize = (loadFunction) => {
	let product;

	return function (...args) {
		if (!product) {
			product = loadFunction();
		}

		return product.apply(this, args);
	};
};

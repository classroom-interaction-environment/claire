export const mapAsync = async (array, callback) => {
	const results = [];
	results.length = array.length;
	for (let i = 0; i < array.length; i++) {
		results[i] = await callback(array[i], i, array);
	}
	return results;
};

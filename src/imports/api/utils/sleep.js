/**
 * Helper to "sleep" for a given interval in ms. Only usable within  async
 * functions.
 * @param ms {Number} the timeout in milliseconds
 * @return {Promise<any>} a promise resolving after the timeout
 */
export const sleep = ms => new Promise(resolve => {
  setTimeout(() => resolve(), ms)
})

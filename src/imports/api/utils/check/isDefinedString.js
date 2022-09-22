/**
 * Checks, whether a given string is defined and has a length, greater than zero.
 * @param value {string=} optional value to check
 * @return {boolean}
 */
export const isDefinedString = value => typeof value === 'string' && value.length > 0

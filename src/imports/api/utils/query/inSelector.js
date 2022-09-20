export const $in = (iterable) => Array.isArray(iterable)
  ? { $in: iterable }
  : { $in: Array.from(iterable) }

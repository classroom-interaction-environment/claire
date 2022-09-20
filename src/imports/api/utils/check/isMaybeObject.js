const positives = ['[object Null]', '[object Undefined]', '[object Object]']

export const isMaybeObject = o => {
  const objStr = Object.prototype.toString.call(o)
  return positives.includes(objStr)
}

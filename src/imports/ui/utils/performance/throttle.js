export const throttle = (fn, until) => {
  let lastTime = 0
  return function (...args) {
    const now = new Date()
    if (now - lastTime >= until) {
      fn.call(this, ...args)
      lastTime = now
    }
  }
}

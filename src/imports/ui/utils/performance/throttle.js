export const throttle = (fn, until) => {
  let lastTime = 0
  return function (...args) {
    const self = this
    let now = new Date()
    if (now - lastTime >= until) {
      fn.call(self, ...args)
      lastTime = now
    }
  }
}

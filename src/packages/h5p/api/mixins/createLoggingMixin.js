export const createLoggingMixin = ({ type, logType }) => options => {
  const { name, run } = options
  const logName = `[${type}][${name}]:`

  options.run = function (...args) {
    const env = this
    console.debug(logName, 'called by', env.userId)
    try {
      return run.call(env, ...args)
    }
    catch (e) {
      console.error(logName, e)
      throw e
    }
  }

  return options
}

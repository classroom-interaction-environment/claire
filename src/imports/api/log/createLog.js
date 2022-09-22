import { Meteor } from 'meteor/meteor'

export const LogTypes = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error'
}

/**
 * @deprecated
 */
export const createDebugLog = (name, type = LogTypes.debug, { devOnly } = {}) => {
  console.warn(name, 'Deprecated: createDebugLog is deprecated, use createLog instead')
  return noOp
}

const time = () => new Date().toISOString()
const noOp = () => {}
/**
 * @deprecated
 */
export const createInfoLog = (name, { devOnly } = {}) => {
  console.warn(name, 'Deprecated: createInfoLog is deprecated, use createLog instead')
  return noOp
}

const LOG_LEVEL = Meteor.settings.public.logLevel || 0
const isDevelopment = Meteor.isDevelopment
const internal = {
  debug: {
    level: 0,
    run: (...args) => console.debug(...args)
  },
  info: {
    level: 1,
    run: (...args) => console.info(...args)
  },
  log: {
    level: 2,
    run: (...args) => console.log(...args)
  },
  warn: {
    level: 3,
    run: (...args) => console.warn(...args)
  },
  error: {
    level: 4,
    run: (...args) => console.error(...args)
  }
}

/**
 * Creates a log for a given name and type.
 * Returns a no-op function if devOnly is true but app is in prod mode
 * @param name {
 * @param type
 * @param devOnly
 * @return {*}
 */
export const createLog = ({ name, type = 'log', devOnly }) => {
  if (!Object.prototype.hasOwnProperty.call(internal, type)) {
    throw new TypeError(`Unsupported log type ${type}.`)
  }

  if (devOnly && !isDevelopment) { return noOp }

  const logProp = internal[type]

  if (LOG_LEVEL > logProp.level) { return noOp }

  const logName = `${type} [${name}]:`
  const logFn = logProp.run

  if (Meteor.isProduction && Meteor.isServer) {
    return (...args) => logFn(time(), logName, ...args)
  }
  // by default node and browsers add timestamp on their own
  return (...args) => logFn(logName, ...args)
}

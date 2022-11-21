import { Meteor } from 'meteor/meteor'

const time = () => new Date().toISOString()
const noOp = () => {}
const LOG_LEVEL = Meteor.settings.public.logLevel || 0
const isDevelopment = Meteor.isDevelopment

// eslint-disable no-console
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
// eslint-enable no-console

/**
 * Creates a log for a given name and type.
 * Returns a no-op function if devOnly is true but app is in prod mode
 * @param name {string}
 * @param type {'log'|'info'|'debug'|'warn'|'error'}
 * @param devOnly {boolean=false}
 * @return {function}
 */
export const createLog = ({ name, type = 'log', devOnly = false }) => {
  if (!Object.prototype.hasOwnProperty.call(internal, type)) {
    throw new TypeError(`Unsupported log type ${type}.`)
  }

  if (devOnly && !isDevelopment) { return noOp }

  const logProp = internal[type]

  if (LOG_LEVEL > logProp.level) { return noOp }

  const logName = `${type} [${name}]:`
  const logFn = logProp.run

  // on the server we need to add a timestamp in production mode
  // since they are not there by default
  if (Meteor.isProduction && Meteor.isServer) {
    return (...args) => logFn(time(), logName, ...args)
  }

  // by default node and browsers add timestamp on their own
  return (...args) => logFn(logName, ...args)
}

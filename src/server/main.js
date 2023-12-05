import '../imports/startup/server/system'
import '../imports/startup/server/accounts'
import '../imports/startup/server/plugins'
import '../imports/startup/server/contexts'

global.analyzeMigrations = () => {
  const methods = Object.entries(Meteor.server.publish_handlers)
  let count = 0
  for (const [name, method] of methods) {
    const isAsync = method.constructor.name === 'AsyncFunction'
    if (!isAsync) {
      console.log(name, isAsync)
      count++
    }
  }

  const asyncReady = {
    count: methods.length - count,
    perc: 100 * (methods.length - count) / (methods.length || 1)
  }
  const toMigrate = { count, perc: 100 * count / (methods.length || 1) }

  console.debug('Methods sumary:', methods.length, 'methods')
  console.debug('async-ready', asyncReady.count, `(${asyncReady.perc}%)`)
  console.debug('to migrate', toMigrate.count, `(${toMigrate.perc}%)`)
}
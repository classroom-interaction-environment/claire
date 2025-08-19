import { Meteor } from 'meteor/meteor'
import { runRateLimiter, rateLimitAccounts, rateLimitPublication } from '../../../infrastructure/factories/rateLimit'
import { createLog } from '../../../api/log/createLog'

const log = createLog({ name: 'RateLimiter', type: 'warn' })

Meteor.startup(() => {
  rateLimitAccounts()
  rateLimitBuiltins()

  const callback = (reply, input) => {
    if (reply.allowed) {
      return undefined
    }
    else {
      log('limit exceeded', JSON.stringify(input), JSON.stringify(reply))
      // TODO track error
    }
  }

  runRateLimiter(callback, true, true)
})

function rateLimitBuiltins () {
  [
    'meteor_facts',
    'users'
  ].forEach(name => rateLimitPublication({ name }))
}

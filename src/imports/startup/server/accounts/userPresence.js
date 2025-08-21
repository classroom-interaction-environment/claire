import { Meteor } from 'meteor/meteor'
import { UserPresenceSessions, initUserPresence } from 'meteor/jkuester:userpresence'
import { createLog } from '../../../api/log/createLog'

Meteor.startup(async () => {
  await initUserPresence()
  const log = createLog({ name: 'UserPresence' })
  const sessionReset = UserPresenceSessions.remove({})
  const usersReset = Meteor.users.update({
    presence: { $exists: true }
  }, {
    $set: { 'presence.status': 'offline' }
  }, { multi: true })

  log(`sessions reset = [${sessionReset}]`)
  log(`users reset = [${usersReset}]`)
})

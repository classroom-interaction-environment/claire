import { Meteor } from 'meteor/meteor'
import UserPresence from 'meteor/danimal:userpresence'
import { createLog } from '../../../api/log/createLog'

Meteor.startup(() => {
  const log = createLog({ name: 'UserPresence' })
  const sessionReset = UserPresence.UserPresenceSessions.remove({})
  const usersReset = Meteor.users.update({
    presence: { $exists: true }
  }, {
    $set: { 'presence.status': 'offline' }
  }, { multi: true })

  log(`sessions reset = [${sessionReset}]`)
  log(`users reset = [${usersReset}]`)
})

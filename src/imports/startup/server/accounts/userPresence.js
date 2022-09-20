import { Meteor } from 'meteor/meteor'
import UserPresence from 'meteor/danimal:userpresence'

Meteor.startup(() => {
  const sessionReset = UserPresence.UserPresenceSessions.remove({})
  const usersReset = Meteor.users.update({
    presence: { $exists: true }
  }, {
    $set: { 'presence.status': 'offline' }
  }, { multi: true })

  console.log(`[Presence]: sessions reset = [${sessionReset}]`)
  console.log(`[Presence]: users reset = [${usersReset}]`)
})

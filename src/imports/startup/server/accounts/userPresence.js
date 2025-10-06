import { Meteor } from 'meteor/meteor'
import { UserPresenceSessions, initUserPresence } from 'meteor/jkuester:userpresence'
import { createLog } from '../../../api/log/createLog'

Meteor.startup(async () => {
  await initUserPresence()
  const log = createLog({ name: 'UserPresence' })
  const sessionReset = await UserPresenceSessions.removeAsync({})
  const usersReset = await Meteor.users.updateAsync({
    presence: { $exists: true }
  }, {
    $set: { 'presence.status': 'offline' }
  }, { multi: true })

  log(`sessions reset = [${sessionReset}]`)
  log(`users reset = [${usersReset}]`)
})

import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { createInfoLog } from '../../../../api/log/createLog'

const shouldMigrate = Meteor.settings.patch?.roles
const info = createInfoLog('Roles')
const migrateRoles = Meteor.bindEnvironment(function (count) {
  info('running database migration, count=', count)
  Roles._forwardMigrate()
  Roles._forwardMigrate2()

// update users roles
  Meteor.users.find().forEach(user => {
    if (!user.roles || user.roles.length === 0) {
      const roles = Roles.getRolesForUser(user._id)
      const updated = Meteor.users.update(user._id, { $addToSet: { roles } })
      info('updated roles for user after migrate:')
      info('>', user._id)
      info('>', roles)
      info('>', updated ? 'updated' : 'failed')
    }
  })
})

if (shouldMigrate) {
  for (let i = 0; i < 3; i++) {
    try {
      migrateRoles(i)
    } catch (e) {
      console.error(e)
    }
  }
}

else {
  info('skip patch migration script')
}

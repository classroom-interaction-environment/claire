import { Meteor } from 'meteor/meteor'
import { Mongo } from 'meteor/mongo'
import { Accounts } from 'meteor/accounts-base'
import { adminExists } from '../../../api/accounts/admin/adminExists'
import { createAdmin } from '../../../api/accounts/admin/createAdmin'
import { UserFactory } from '../../../api/accounts/registration/UserFactory'
import { onServerExec } from '../../../api/utils/archUtils'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { Roles } from 'meteor/alanning:roles'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { createLog } from '../../../api/log/createLog'

/**
 * This ensures there is always an initial admin and the initial admin can only be created from this config.
 * There is no Meteor method access to create the initial admin.
 */

onServerExec(Meteor.bindEnvironment(function () {
  const log = createLog(Admin)
  log('start setup')

  const initAdmin = function () {
    if (adminExists()) {
      return log('setup complete (admin exists)')
    }

    if (Meteor.users.find().count() > 0) {
      log('There are users but no admin!')
    }

    const adminDoc = Meteor.settings.accounts.admin
    adminDoc.role = UserUtils.roles.admin

    const userId = UserFactory.create(adminDoc)
    const adminId = createAdmin(userId)

    // add admin to global scope
    // so the client app can easily
    // detect an admin for better ux
    const adminRoles = [
      UserUtils.roles.admin,
      UserUtils.roles.curriculum
    ]
    Roles.addUsersToRoles(userId, adminRoles, null)

    Accounts.sendResetPasswordEmail(userId)
    log('admin initialized -> ', Boolean(userId && adminId))
    log('setup complete')
  }

  // in case this is an old running instance, we need to run
  // the migration in order to get the admin collection right
  const OldAdminsCollection = Mongo.Collection.get('Admins')
  if (OldAdminsCollection) {
    log('migrate database')
    OldAdminsCollection.rawCollection().rename(Admin.name, null, (err) => {
      if (err) {
        console.error(err)
        return process.exit(1)
      }
      log('database successfully migrated')
      initAdmin()
    })
  } else {
    initAdmin()
  }
}))

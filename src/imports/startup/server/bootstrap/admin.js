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
onServerExec(async () => {
  const log = createLog(Admin)
  log('start setup')

  const initAdmin = async () => {
    if (await adminExists()) {
      return log('setup complete (admin exists)')
    }

    if (await Meteor.users.countDocuments({}) > 0) {
      log('There are users but no admin!')
    }

    const adminDoc = Meteor.settings.accounts.admin
    adminDoc.role = UserUtils.roles.admin

    const userId = await UserFactory.create(adminDoc)
    const adminId = await createAdmin(userId)

    // add admin to global scope
    // so the client app can easily
    // detect an admin for better ux
    const adminRoles = [
      UserUtils.roles.admin,
      UserUtils.roles.curriculum
    ]
    await Roles.addUsersToRolesAsync(userId, adminRoles, null)

    await Accounts.sendResetPasswordEmail(userId)
    log('admin initialized -> ', Boolean(userId && adminId))
    log('setup complete')
  }

  const onError = err => {
    console.error(err)
    process.exit(1)
  }

  // in case this is an old running instance, we need to run
  // the migration in order to get the admin collection right
  const OldAdminsCollection = Mongo.Collection.get('Admins')
  if (OldAdminsCollection) {
    log('auto-migrate database')
    OldAdminsCollection.rawCollection().rename(Admin.name, null, (err) => {
      if (err) {
        return onError(err)
      }
      log('database successfully migrated')
      initAdmin().catch(onError)
    })
  }
  else {
    initAdmin().catch(onError)
  }
})

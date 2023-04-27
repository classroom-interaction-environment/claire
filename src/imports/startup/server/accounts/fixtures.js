import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { UserFactory } from '../../../api/accounts/registration/UserFactory'
import { createLog } from '../../../api/log/createLog'

/**
 * Generate some default users for given roles and institution.
 */

if (Meteor.settings.accounts.fixtures) {
  const defaultAccounts = Object.assign({}, Meteor.settings.accounts.fixtures)
  const defaultAccountsKeys = Object.keys(defaultAccounts)
  const info = createLog({ name: 'user fixtures' })

  Meteor.startup(() => {
    info('start setup')

    // skip if there is nothing to create at all
    if (!defaultAccountsKeys || !defaultAccountsKeys.length) {
      return info('skip, no users to create')
    }

    defaultAccountsKeys.forEach(role => {
      if (!UserUtils.roles[role]) {
        throw new Error(`Unexpected role ${role}`)
      }

      if (role === UserUtils.roles.admin) {
        throw new Error('No admins should be created by fixtures.')
      }

      const roleName = `[${role}]`

      // get current user or skip if undefined
      const users = defaultAccounts[role]
      if (!users || users.length === 0) {
        return info(roleName, 'skip role, no users to create')
      }

      info(roleName, 'create accounts')

      users.forEach(({ firstName, lastName, email, institution }) => {
        const emailName = `[${email}]`

        // skip this, if the user already exists
        if (Accounts.findUserByEmail(email)) {
          return info(roleName, emailName, 'skip user, already created')
        }

        // create basic user account
        const userId = UserFactory.create({ firstName, lastName, email, role, institution })
        info(roleName, emailName, 'user created')
        info(roleName, emailName, '>', userId)

        Accounts.sendEnrollmentEmail(userId)
        info(roleName, emailName, '> notification mail sent')
      })

      info(roleName, 'complete')
    })

    info('setup complete')
  })
}

import { loggedOut } from '../../accounts/user/loggedOut'
import { Meteor } from 'meteor/meteor'
import { Router } from '../Router'
import { check } from 'meteor/check'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { createDebugLog } from '../../log/createLog'

const debug = createDebugLog('adminTrigger', 'debug', { devOnly: true })

export const createAdminTrigger = ({ redirectRoute, forbiddenRoute }) => {
  check(redirectRoute.path, Function)
  check(forbiddenRoute.path, Function)

  return function adminTrigger () {
    if (loggedOut()) {
      debug('loggedOut')
      const location = Router.location()
      const fullPath = redirectRoute.path(encodeURIComponent(location))
      return Router.go(fullPath)
    }

    const userId = Meteor.userId()
    if (!UserUtils.hasAtLeastRole(userId, UserUtils.roles.schoolAdmin)) {
      debug('not an admin')
      return setTimeout(() => Router.go(forbiddenRoute.path()), 300)
    }

    debug('checks passed')
  }
}

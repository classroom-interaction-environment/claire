/* global Facts */
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'

Facts.setUserIdFilter(function (userId) {
  return UserUtils.isAdmin(userId)
})

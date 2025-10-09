import { isomporph } from '../../utils/archUtils'
import { Meteor } from 'meteor/meteor'
import { getUsersCollection } from '../../utils/getUsersCollection'
import { Hierarchy } from './Hierarchy'

export const isAdmin = isomporph({
  client: function () {
    return function isAdmin (userId = Meteor.userId()) {
      if (!userId) return false
      const user = getUsersCollection().findOne(userId)

      if (!user) return false
      return Roles.userIsInRole(userId, Hierarchy.admin, user.institution)
    }
  },

  server: function () {
    import { userIsAdmin } from '../admin/userIsAdmin'

    return function isAdmin (userId = Meteor.userId()) {
      if (!userId) return false
      return userIsAdmin(userId)
    }
  }
})
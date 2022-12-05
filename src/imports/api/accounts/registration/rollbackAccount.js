import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { getCollection } from '../../utils/getCollection'
import { getUsersCollection } from '../../utils/getUsersCollection'

export const rollbackAccount = userId => {
  check(userId, String)

  const AdminCollection = getCollection(Admin.name)
  const adminRemoved = AdminCollection.remove({ userId })

  const rolesRemoved = Meteor.roleAssignment.remove({ 'user._id': userId })
  const userRemoved = getUsersCollection().remove(userId)

  return { adminRemoved, rolesRemoved, userRemoved }
}

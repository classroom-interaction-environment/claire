import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Admin } from '../../../contexts/system/accounts/admin/Admin'
import { getCollection } from '../../utils/getCollection'
import { getUsersCollection } from '../../utils/getUsersCollection'

export const rollbackAccount = async userId => {
  check(userId, String)

  const AdminCollection = getCollection(Admin.name)
  const adminRemoved = await AdminCollection.removeAsync({ userId })

  const rolesRemoved = await Meteor.roleAssignment.removeAsync({ 'user._id': userId })
  const userRemoved = await getUsersCollection().removeAsync(userId)

  return { adminRemoved, rolesRemoved, userRemoved }
}

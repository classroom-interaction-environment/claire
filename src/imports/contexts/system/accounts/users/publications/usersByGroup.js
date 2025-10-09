import { getCollection } from '../../../../../api/utils/getCollection'
import { Group } from '../../../../classroom/group/Group'
import { Meteor } from 'meteor/meteor'
import { Users } from '../User'

export const usersByGroup = async ({ userId, groupId }) => {
  const groupDoc = await getCollection(Group.name).findOneAsync({ _id: groupId, users: { $elemMatch: { userId } } })

  if (!groupDoc) {
    throw new Meteor.Error('error.docNotFound')
  }

  const userIds = groupDoc.users.map(doc => doc.userId)
  return Meteor.users.find({ _id: { $in: userIds } }, {
    fields: Users.publicFields
  })
}
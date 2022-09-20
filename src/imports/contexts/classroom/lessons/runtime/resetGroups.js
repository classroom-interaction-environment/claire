import { check } from 'meteor/check'
import { getCollection } from '../../../../api/utils/getCollection'
import { Group } from '../../group/Group'

export const resetGroups = ({ lessonId, userId }) => {
  check(lessonId, String)

  const query = { lessonId }
  const transform = { $set: { visible: [] } }
  const options = { multi: true }
  return getCollection(Group.name).update(query, transform, options)
}

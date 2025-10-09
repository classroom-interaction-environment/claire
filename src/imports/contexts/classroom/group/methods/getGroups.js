import { Group } from '../Group'
import { $in } from '../../../../api/utils/query/inSelector'
import { getCollection } from '../../../../api/utils/getCollection'

export const getGroups = async ({ ids, userId }) => {
  const query = { _id: $in(ids), createdBy: userId }
  return getCollection(Group.name).find(query).fetchAsync()
}
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { Group } from '../Group'
import { checkEditPermission } from '../../../../api/document/checkEditPermissions'
import { getCollection } from '../../../../api/utils/getCollection'

const getGroupDoc = createDocGetter({ name: Group.name })

export const updateGroup = async ({ doc, userId }) => {
  const { _id, ...updateDoc } = doc
  const groupDoc = await getGroupDoc({ _id })
  await checkEditPermission({ doc: groupDoc, userId })
  return getCollection(Group.name).updateAsync({ _id }, { $set: updateDoc })
}

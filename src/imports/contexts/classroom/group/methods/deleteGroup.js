import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { Group } from '../Group'
import { checkEditPermission } from '../../../../api/document/checkEditPermissions'
import { getCollection } from '../../../../api/utils/getCollection'

const getGroupDoc = createDocGetter({ name: Group.name })

export const deleteGroup = async ({ groupId, userId }) => {
  const doc = await getGroupDoc({ _id: groupId })
  await checkEditPermission({ doc, userId })
  return getCollection(Group.name).removeAsync({ _id: groupId })
}

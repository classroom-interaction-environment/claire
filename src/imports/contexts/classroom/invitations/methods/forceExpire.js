import { createGetDoc } from '../../../../api/utils/documentUtils'
import { getCollection } from '../../../../api/utils/getCollection'
import { CodeInvitation } from '../CodeInvitations'
import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'

export const forceExpire = async ({ codeDocId, userId }) => {
  const opts = { checkOwner: ! await userIsAdmin(userId) }
  await createGetDoc(CodeInvitation, opts).call({ userId }, codeDocId)
  return getCollection(CodeInvitation.name).updateAsync({ _id: codeDocId }, {
    $set: { invalid: true }
  })
}

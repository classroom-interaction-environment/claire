import { getCollection } from '../../../../api/utils/getCollection'
import { CodeInvitation } from '../CodeInvitations'
import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { checkOwnership } from '../../../../api/utils/document/checkOwnership'

export const forceExpire = async ({ codeDocId, userId }) => {
  const isAdmin = await userIsAdmin(userId)
  const codeDoc = await createDocGetter({ name: CodeInvitation.name }).call(null, codeDocId)
  if (!isAdmin) {
    await checkOwnership({ document: codeDoc, userId, context: CodeInvitation.name })
  }
  return getCollection(CodeInvitation.name).updateAsync({ _id: codeDocId }, {
    $set: { invalid: true }
  })
}

import { getCollection } from '../../../../api/utils/getCollection'
import { CodeInvitation } from '../CodeInvitations'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'

const getCodeDoc = createDocGetter({ name: CodeInvitation.name })

export const addUserToInvitation = async (codeOrCodeDoc, userId) => {
  const codeDoc = typeof codeOrCodeDoc === 'object'
    ? codeOrCodeDoc
    : await getCodeDoc(codeOrCodeDoc)

  const registeredUsers = codeDoc.registeredUsers || []
  if (registeredUsers.length >= codeDoc.maxUsers) {
    throw new Error(CodeInvitation.errors.maxUsersExceeded)
  }

  registeredUsers.push(userId)
  return getCollection(CodeInvitation.name).updateAsync(codeDoc._id, {
    $set: { registeredUsers }
  })
}
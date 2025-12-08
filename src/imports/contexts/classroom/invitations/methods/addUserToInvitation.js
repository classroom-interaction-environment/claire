import { getCollection } from '../../../../api/utils/getCollection'
import { CodeInvitation } from '../CodeInvitations'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

const getCodeDoc = createDocGetter({ name: CodeInvitation.name })

export const addUserToInvitation = async (codeOrCodeDoc, userId) => {
  const codeDoc = typeof codeOrCodeDoc === 'object'
    ? codeOrCodeDoc
    : await getCodeDoc(codeOrCodeDoc)

  const registeredUsers = codeDoc.registeredUsers || []
  if (registeredUsers.length >= codeDoc.maxUsers) {
    throw new PermissionDeniedError(CodeInvitation.errors.maxUsersExceeded)
  }

  const CodeInvitationCollection = getCollection(CodeInvitation.name)
  return CodeInvitationCollection.updateAsync({ _id: codeDoc._id }, { $push: { registeredUsers: userId } })
}

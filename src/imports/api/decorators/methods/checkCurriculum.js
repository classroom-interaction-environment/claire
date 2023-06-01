import { userIsCurriculum } from '../../accounts/userIsCurriculum'
import { PermissionDeniedError } from '../../errors/types/PermissionDeniedError'

export const checkCurriculum = ({ userId, isCurriculum, _id, doc }) => {
  const notAllowed = !userId || !isCurriculum || !userIsCurriculum(userId)

  if (notAllowed) {
    throw new PermissionDeniedError('curriculum.noPermission', { _id, userId, doc })
  }
}

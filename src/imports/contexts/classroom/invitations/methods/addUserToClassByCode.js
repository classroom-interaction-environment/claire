import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { getUsersCollection } from '../../../../api/utils/getUsersCollection'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { isMemberOfClass } from '../../schoolclass/helpers/isMemberOfClass'
import { Users } from '../../../system/accounts/users/User'
import { CodeInvitation } from '../CodeInvitations'
import { UserUtils } from '../../../system/accounts/users/UserUtils'
import { addStudent } from '../../schoolclass/methods/addStudent'
import { addTeacher } from '../../schoolclass/methods/addTeacher'
import { addUserToInvitation } from './addUserToInvitation'
import { validateInvitation } from '../validation/validateInvitation'

const getClassDoc = createDocGetter({ name: SchoolClass.name })
const getCodeDoc  = createDocGetter({ name: CodeInvitation.name })

export const addUserToClassByCode = async ({ code, userId }) => {
// 1st validate code
  const isValid = validateInvitation(code)
  if (!isValid) {
    throw new PermissionDeniedError(CodeInvitation.errors.invalidCode)
  }

  // 2nd validate user
  const user = await getUsersCollection().findOneAsync(userId)
  if (!Users.helpers.verify(user)) {
    console.warn('warning adding unverified user', user._id)
    // throw new PermissionDeniedError('user.notVerified')
  }

  const codeDoc = await getCodeDoc(code)
  if (!codeDoc) throw new DocNotFoundError(code)

  // 3rd get class doc
  const { classId } = codeDoc
  const classDoc = getClassDoc(classId)

  // 4th validate if user is already member
  const isStudent = isMemberOfClass({ classDoc, userId })
  if (isStudent) {
    throw new PermissionDeniedError(CodeInvitation.errors.alreadyClassMember, JSON.stringify({
      classId,
      userId
    }))
  }

  // 5th check roles match
  const { role } = codeDoc
  if (!await UserUtils.hasRole(userId, role, user.institution)) {
    throw new PermissionDeniedError(PermissionDeniedError.notInRole, role)
  }

  const teacherId = codeDoc.createdBy

  // 6th add to class
  if (role === UserUtils.roles.teacher) {
    await addTeacher({ classId, userId, teacherId })
  }
  else if (role === UserUtils.roles.student) {
    const added = await addStudent({ classId, userId, teacherId })
    if (!added) throw new Meteor.Error(500)
    await getUsersCollection().updateAsync(userId, { $set: { 'ui.classId': classId } })
  }
  else {
    throw new PermissionDeniedError(SchoolClass.errors.invalidRole, role)
  }

  // add
  await addUserToInvitation({ code, userId })
  return true
}
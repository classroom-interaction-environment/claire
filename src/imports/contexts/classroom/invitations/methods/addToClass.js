import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { Meteor } from 'meteor/meteor'
import { Users } from '../../../system/accounts/users/User'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'
import { UserUtils } from '../../../system/accounts/users/UserUtils'
import { CodeInvitation } from '../CodeInvitations'

const getClassDoc = createDocGetter(SchoolClass)

export const addToClass = function ({ code }) {
  // 1st validate code
  const isValid = CodeInvitation.helpers.validate(code)
  if (!isValid) {
    throw new PermissionDeniedError(CodeInvitation.errors.invalidCode)
  }

  // 2nd validate user
  const userId = this.userId
  const user = Meteor.users.findOne(userId)
  if (!Users.helpers.verify(user)) {
    console.warn('warning adding unverified user', user._id)
    // throw new PermissionDeniedError('user.notVerified')
  }

  const codeDoc = CodeInvitation.helpers.getCodeDoc(code)
  if (!codeDoc) throw new DocNotFoundError(code)

  // 3rd get class doc
  const { classId } = codeDoc
  const classDoc = getClassDoc(classId)

  // 4th validate if user is already member
  const isStudent = SchoolClass.helpers.isMember({ classDoc, userId })
  if (isStudent) {
    throw new PermissionDeniedError(CodeInvitation.errors.alreadyClassMember, JSON.stringify({
      classId,
      userId
    }))
  }

  // 5th check roles match
  const { role } = codeDoc
  if (!UserUtils.hasRole(userId, role, user.institution)) {
    throw new PermissionDeniedError(PermissionDeniedError.notInRole, role)
  }

  // 6th add to class
  const thisContext = { userId: codeDoc.createdBy }
  if (role === UserUtils.roles.teacher) {
    SchoolClass.helpers.addTeacher.call(thisContext, { classId, userId })
  }
  else if (role === UserUtils.roles.student) {
    const added = SchoolClass.helpers.addStudent.call(thisContext, {
      classId,
      userId
    })
    if (!added) throw new Meteor.Error(500)
    Meteor.users.update(userId, { $set: { 'ui.classId': classId } })
  }
  else {
    throw new PermissionDeniedError(SchoolClass.errors.invalidRole, role)
  }

  // add
  CodeInvitation.helpers.addUserToInvitation.call(thisContext, code, userId)
  return true
}
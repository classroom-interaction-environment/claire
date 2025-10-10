import { Random } from 'meteor/random'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { Meteor } from 'meteor/meteor'
import { getUsersCollection } from '../../../../api/utils/getUsersCollection'
import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
import { getCollection } from '../../../../api/utils/getCollection'
import { CodeInvitation } from '../CodeInvitations'
import { isTeacher } from '../../schoolclass/helpers/isTeacher'
import { canInvite } from '../../../../api/accounts/roles/canInvite'
import { Hierarchy } from '../../../../api/accounts/roles/Hierarchy'



export const createInvitation = async ({ userId, createDoc }) => {
  // check if institution matches
  const user = await getUsersCollection().findOneAsync({ _id: userId })
  const { institution } = user

  if (!await canInvite({ userId, user, role: createDoc.role, institution })) {
    throw new Meteor.Error(
      'codeInvitation.createFailed',
      CodeInvitation.errors.insufficientRole,
      { userId, role: createDoc.role }
    )
  }

  if (institution !== createDoc.institution && !await userIsAdmin(userId)) {
    throw new Meteor.Error(
      'codeInvitation.createFailed',
      CodeInvitation.errors.institutionMismatch,
      { institution: createDoc.institution, userId }
    )
  }

  const insertDoc = {
    code: Random.id(4),
    expires: createDoc.expires,
    role: createDoc.role,
    firstName: createDoc.firstName,
    lastName: createDoc.lastName,
    email: createDoc.email,
    institution: createDoc.institution,
    registeredUsers: [],
    maxUsers: createDoc.maxUsers,
    classId: createDoc.classId
  }

  // verify class ownership
  if (createDoc.role === Hierarchy.student) {
    const { classId } = createDoc
    const getClassDoc = createDocGetter({ name: SchoolClass.name })
    const classDoc = await getClassDoc(classId)

    if (!isTeacher(userId, classDoc)) {
      throw new PermissionDeniedError('schoolClass.notTeacher', { classId, userId })
    }
  }
  // otherwise remove class entirely
  else {
    delete insertDoc.classId
  }

  return getCollection(CodeInvitation.name).insertAsync(insertDoc)
}

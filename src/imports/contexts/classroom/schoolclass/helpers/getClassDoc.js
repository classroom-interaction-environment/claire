import { check } from 'meteor/check'
import { getCollection } from '../../../../api/utils/getCollection'
import { SchoolClass } from '../SchoolClass'
import { ensureDocumentExists } from '../../../../api/utils/document/ensureDocumentExists'
import { isTeacher } from './isTeacher'
import { isOwner } from './isOwner'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

export const getClassDoc = async ({ classId, teacherId }) => {
  check(classId, String)
  check(teacherId, String)

  const collection = getCollection(SchoolClass.name)
  const classDoc = await collection.findOneAsync(classId)
  await ensureDocumentExists({
    name: SchoolClass.name,
    docId: classId,
    userId: teacherId,
    document: classDoc
  })

  if (!isTeacher(teacherId, classDoc) && !isOwner(teacherId, classDoc)) {
    throw new PermissionDeniedError(SchoolClass.errors.notTeacher)
  }

  return classDoc
}
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'
import { SchoolClass } from '../SchoolClass'
import { getCollection } from '../../../../api/utils/getCollection'
import { isTeacher } from '../helpers/isTeacher'
import { getClassDoc } from '../helpers/getClassDoc'

/**
 * Adds a teacher to a school class, if the person by given teacherId has permission
 * @param classId
 * @param userId
 * @param teacherId
 * @return {Promise<*>}
 */
export const addTeacher = async ({ classId, userId, teacherId }) => {
  const classDoc = await getClassDoc({ classId, teacherId })

  if (isTeacher(userId, classDoc)) {
    throw new PermissionDeniedError(SchoolClass.errors.alreadyMember, { classId, userId })
  }

  return getCollection(SchoolClass.name).updateAsync(classId, { $addToSet: { teachers: userId } })
}
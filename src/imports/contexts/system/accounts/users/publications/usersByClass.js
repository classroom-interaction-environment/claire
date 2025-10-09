import { getUsersCollection } from '../../../../../api/utils/getUsersCollection'
import { createDocGetter } from '../../../../../api/utils/document/createDocGetter'
import { PermissionDeniedError } from '../../../../../api/errors/types/PermissionDeniedError'
import { SchoolClass } from '../../../../classroom/schoolclass/SchoolClass'
import { isMember } from '../../../../classroom/schoolclass/helpers/isMember'

export const usersByClass = async ({ userId, classId, skip }) => {
  const getClassDoc = createDocGetter({ name: SchoolClass.name })
  const classDoc = await getClassDoc(classId)

  if (!isMember(userId, classDoc)) {
    throw new PermissionDeniedError(SchoolClass.errors.notMember, { userId, classId })
  }

  const allStudents = (classDoc.students || [])
  const allTeachers = (classDoc.teachers || [])
  const allUsers = allStudents.concat(allTeachers)
  const projection = {
    fields: {
      emails: 0,
      services: 0
    },
    limit: allUsers.length
  }

  const query = { _id: { $in: allUsers } }

  if (skip && skip.length > 0) {
    query._id.$nin = skip
  }

  return getUsersCollection().find(query, projection)
}

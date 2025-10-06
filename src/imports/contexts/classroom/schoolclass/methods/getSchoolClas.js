import { getCollection } from '../../../../api/utils/getCollection'
import { SchoolClass } from '../SchoolClass'

export const getSchoolClass = async ({ classId, userId }) => {
  const query = {
    $or: [
      { _id: classId, students: userId },
      { _id: classId, createdBy: userId }
    ]
  }
  return getCollection(SchoolClass.name).find(query, { limit: 1 }).fetchAsync()
}
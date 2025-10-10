import { getCollection } from '../../../../api/utils/getCollection'
import { Lesson } from '../Lesson'

export const countLessons = async ({ userId, classIds }) => {
  const out = Object.create(null)
  const LessonCollection = getCollection(Lesson.name)

  for (const classId of classIds) {
    const query = { classId, createdBy: userId }
    out[classId] = await LessonCollection.countDocuments(query)
  }

  return out
}
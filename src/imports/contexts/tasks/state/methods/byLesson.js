import { TaskWorkingState } from '../TaskWorkingState'
import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { getCollection } from '../../../../api/utils/getCollection'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { checkIsMember } from '../../../classroom/lessons/helpers/checkIsMember'

const getLessonDoc = createDocGetter({ name: Lesson.name, optional: false })
const getClassDoc = createDocGetter({ name: SchoolClass.name, optional: false })

export const taskWorkingStateByLesson = async ({ lessonId, userId }) => {
  const lessonDoc = await getLessonDoc(lessonId)
  const classDoc = await getClassDoc(lessonDoc.classId)
  await checkIsMember({ classDoc, userId })
  return getCollection(TaskWorkingState.name).find({ lessonId })
}

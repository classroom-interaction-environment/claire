import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { isMember } from '../../schoolclass/helpers/isMember'

const getClassDoc = createDocGetter({ name: SchoolClass.name })

export const isMemberOfLesson = async ({ userId, lessonDoc }) => {
  const classDoc = await getClassDoc(lessonDoc.classId)
  return isMember(userId, classDoc)
}

/**
 * @deprecated
 */
export const isMemberOfLesson = ({ userId, lessonId, lessonDoc }) => {
  import { LessonHelpers } from '../LessonHelpers'
  return LessonHelpers.isMemberOfLesson({ userId, lessonId })
}

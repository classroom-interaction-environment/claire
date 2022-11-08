export const isMemberOfLesson = ({ userId, lessonId, lessonDoc }) => {
  import { Lesson } from '../Lesson'
  return Lesson.helpers.isMemberOfLesson({ userId, lessonId })
}

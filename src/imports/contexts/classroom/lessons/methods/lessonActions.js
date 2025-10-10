import { LessonStates } from '../LessonStates'
import { Meteor } from 'meteor/meteor'
import { LessonErrors } from '../LessonErrors'
import { Lesson } from '../Lesson'
import { createUpdateDoc } from '../../../../api/utils/documentUtils'
import { getDocsForTeacher } from '../helpers/getDocsForTeacher'

let _updateLesson

const updateLesson = async ({ self, lessonId, modifier }) => {
  if (!_updateLesson) {
    _updateLesson = createUpdateDoc({ name: Lesson.name })
  }
  return _updateLesson.call(self, lessonId, modifier)
}

/**
 * Starts a lesson by _id.
 * @async
 * @throws Meteor.Error if the lesson is not found by _id
 * @throws Meteor.Error if the lesson is not owned by the user
 * @throws Meteor.Error if the lesson is not in idle state
 * @param lessonId {string} The _id of the target lesson
 * @param userId {string} The person supposed to permitted to start the lesson
 * @return {Boolean} A boolean value, whether the operation has been successful
 */
export const startLesson = async ({ userId, lessonId }) => {
  const { lessonDoc } = await getDocsForTeacher({ lessonId, userId })

  if (!LessonStates.canStart(lessonDoc)) {
    throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedIdle', { lessonId, userId })
  }

  const startedAt = new Date()
  const modifier = { $set: { startedAt } }
  return !!(await updateLesson({ self: this, lessonId, modifier }))
}

/**
 * Completes a lesson by _id
 * @async
 * @param lessonId {string} The _id of the target lesson
 * @param userId {string} The person supposed to permitted to start the lesson
 * @throws Meteor.Error if lesson is not in running state
 * @return {Boolean} A boolean value, whether the operation has been successful
 */
export const completeLesson = async ({ userId, lessonId }) => {
  const { lessonDoc } = await getDocsForTeacher({ lessonId, userId })

  if (!LessonStates.canComplete(lessonDoc)) {
    throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedRunning')
  }

  // this is our indicator for the lesson being completed
  const completedAt = new Date()

  // we also unset all visible materials, to prevent any runtime issues
  // with current opened materials on the student views, that could arise
  // during the state changing from running to completed
  const visibleStudent = []

  const modifier = { $set: { completedAt, visibleStudent } }
  return !!(await updateLesson({ self: this, lessonId, modifier }))
}

/**
 * Stops a lesson by _id
 * @param lessonId {string} The _id of the target lesson
 * @param userId {string} The person supposed to permitted to start the lesson
 * @throws Meteor.Error if lesson is not in running state
 * @return {Boolean} A boolean value, whether the operation has been successful
 */

export const stopLesson = async ({ userId, lessonId }) => {
  const { lessonDoc } = await getDocsForTeacher({ lessonId, userId })
  if (!LessonStates.isRunning(lessonDoc)) {
    throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedRunning', { lessonId, userId })
  }

  const modifier = { $unset: { startedAt: 1 } }
  return !!(await updateLesson({ self: this, lessonId, modifier }))
}

/**
 * Resumes a lesson by _id
 * @param lessonId {string} The _id of the target lesson
 * @param userId {string} The person supposed to permitted to start the lesson
 * @throws Meteor.Error if lesson is not in completed state
 * @return {Boolean} A boolean value, whether the operation has been successful
 */
export const resumeLesson = async ({ userId, lessonId }) => {
  const { lessonDoc } = await getDocsForTeacher({ lessonId, userId })
  if (!LessonStates.canResume(lessonDoc)) {
    throw new Meteor.Error(LessonErrors.unexpectedState, 'lesson.errors.expectedComplete', { lessonId, userId })
  }
  const modifier = { $unset: { completedAt: 1 } }
  return !!(await updateLesson({ self: this, lessonId, modifier }))
}

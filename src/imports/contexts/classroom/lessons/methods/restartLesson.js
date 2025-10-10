import { LessonHelpers } from '../LessonHelpers'
import { LessonStates } from '../LessonStates'
import { Meteor } from 'meteor/meteor'
import { LessonRuntime } from '../runtime/LessonRuntime'
import { getDocsForTeacher } from '../helpers/getDocsForTeacher'
import { LessonErrors } from '../LessonErrors'
import { createUpdateDoc } from '../../../../api/utils/documentUtils'
import { Lesson } from '../Lesson'
import { notMigrated } from '../../../../infrastructure/functions/notMIgrated'

const updateLesson = createUpdateDoc(Lesson, { checkOwner: false })

/**
 * Restartes a lesson by _id and removes all data that has been generated during the lesson run
 * TODO also check here if an inversion of control is possible, since we
 * TODO will definitely have to expand the list of contexts that will be used here
 * @throws Meteor.Error if lesson is not in running state and also not in completed state
 * @param _id The _id of the target lesson
 * @return {object} A boolean value, whether the operation has been successful
 */
export const restartLesson = async ({ lessonId, userId }) => {
  notMigrated()
  const { lessonDoc } = await getDocsForTeacher({ lessonId, userId })

  if (!LessonStates.canRestart(lessonDoc)) {
    throw new Meteor.Error(
      LessonErrors.unexpectedState,
      'lesson.errors.expectedRestartable',
      { lessonId, userId }
    )
  }

  const options = { lessonId, userId, unitId: lessonDoc.unit }
  const runtimeDocs = await LessonRuntime.removeDocuments(options)
  const groupDocs = await LessonRuntime.resetGroups(options)
  const beamerReset = await LessonRuntime.resetBeamer(options)
  const lessonReset = !!updateLesson.call(this, lessonId, {
    $unset: {
      phase: 1,
      startedAt: 1,
      completedAt: 1,
      artifacts: 1,
      uploads: 1,
      visibleStudent: 1,
      visibleBeamer: 1
    }
  })

  return { runtimeDocs, beamerReset, lessonReset, groupDocs }
}
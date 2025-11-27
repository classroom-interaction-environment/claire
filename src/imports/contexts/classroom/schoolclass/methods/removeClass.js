import { SchoolClass } from '../SchoolClass'
import { Meteor } from 'meteor/meteor'
import { Lesson } from '../../lessons/Lesson'
import { getCollection } from '../../../../api/utils/getCollection'
import { removeLesson } from '../../lessons/methods/removeLesson'
import { getClassDoc } from '../helpers/getClassDoc'
import { canDeleteClass } from '../helpers/canDeleteClass'
import { noop } from '../../../../utils/noop'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

/**
 * Removes a class by given _id and userId. The user must be externally validated!
 * @param classId {string}
 * @param userId {string}
 * @param log {function=}
 * @return {Promise<number>}
 */
export const removeClass = async ({ classId, userId, log = noop }) => {
  const schoolClassDoc = await getClassDoc({ classId, teacherId: userId })

  // check if user is even allowed to delete
  if (!await canDeleteClass(userId, schoolClassDoc)) {
    throw new PermissionDeniedError('errors.notOwnerOrAdmin')
  }

  // first remove all content, created during this lesson
  const LessonCollection = getCollection(Lesson.name)
  const associatedLessons = await LessonCollection.find({ classId, createdBy: userId }).fetchAsync()

  for (const lessonDoc of associatedLessons) {
    // we call the remove method on each lesson here
    // so we let the lesson's remove method handle the
    // removal of lesson-specific content, the units and material
    await removeLesson({ lessonDoc, userId, log })
  }

  // throw if there has something not been removed
  if (await LessonCollection.countDocuments({ classId, createdBy: userId }) > 0) {
    throw new Meteor.Error('schoolClass.errors.removeFailed', 'schoolClass.errors.failedToRemoveLessons')
  }

  // remove the class doc finally
  const SchoolClassCollection = getCollection(SchoolClass.name)
  return SchoolClassCollection.removeAsync({ _id: classId })
}

import { SchoolClass } from '../SchoolClass'
import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../../api/utils/getCollection'
import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
import { removeLesson } from '../../lessons/methods/removeLesson'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'

const getClassDoc = createDocGetter({ name: SchoolClass.name })

/**
 * Removes a class by given _id and userId. The user must be externally validated!
 * @param classId {string}
 * @param userId {string}
 * @param log {function=}
 * @return {number}
 */
export const removeClass = function removeClass ({ classId, userId, log = () => {} }) {
  const { Lesson } = require('../../lessons/Lesson')
  const schoolClassDoc = getClassDoc(classId)

  // check if user is even allowed to delete
  const canDelete = userId === schoolClassDoc.createdBy || userIsAdmin(userId)
  
  if (!canDelete) {
    throw new Error('errors.permissionDenied', 'errors.notOwnerOrAdmin')
  }

  // first remove all content, created during this lesson
  const LessonCollection = getCollection(Lesson.name)
  const associatedLessons = LessonCollection.find({ classId, createdBy: userId })

  associatedLessons.forEach(lessonDoc => {
    // we call the remove method on each lesson here
    // so we let the lesson's remove method handle the
    // removal of lesson-specific content, the units and material
    removeLesson({ lessonDoc, userId, log })
  })

  // throw if there has something not been removed
  if (LessonCollection.find({ classId, createdBy: userId }).count() > 0) {
    throw new Meteor.Error('schoolClass.errors.removeFailed', 'schoolClass.errors.failedToRemoveLessons')
  }

  // remove the class doc finally
  const SchoolClassCollection = getCollection(SchoolClass.name)
  return SchoolClassCollection.remove({ _id: classId })
}

import { Meteor } from 'meteor/meteor'
import { Lesson } from '../Lesson'
import { LessonRuntime } from '../runtime/LessonRuntime'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { createRemoveAllMaterial } from '../../../material/createRemoveAllMaterial'
import { getCollection } from '../../../../api/utils/getCollection'

const removeAllMaterial = createRemoveAllMaterial({ isCurriculum: false })

/**
 * Removes / deletes a lesson by a given _id. Removes all related documents, too.
 *
 * @param {lessonId} the _id of the lesson to be deleted
 * @param {lessonDoc} the lesson doc of the lesson to be deleted
 * @param {userId} the user of which in behalf to call
 * @return {{lessonRemoved: *, unitRemoved: *, phasesRemoved: *}}
 */

export const removeLesson = function removeLesson ({ lessonId, lessonDoc, userId, log = () => {} }) {
  if (!lessonDoc) {
    lessonDoc = Lesson.helpers.docsForTeacher({ userId, lessonId }).lessonDoc
  }

  if (!lessonDoc) {
    throw new Meteor.Error('removeLesson.error', 'errors.docNotFound', {
      lessonId,
      userId
    })
  }

  if (!lessonId && lessonDoc) {
    lessonId = lessonDoc._id
  }

  const result = {
    lessonRemoved: 0,
    unitRemoved: 0,
    phasesRemoved: 0,
    materialRemoved: 0,
    runtimeDocsRemoved: 0,
    beamerRemoved: 0
  }

  result.runtimeDocsRemoved = LessonRuntime.removeDocuments({
    lessonId,
    userId
  })

  result.beamerRemoved = LessonRuntime.resetBeamer({ lessonId, userId })

  // XXX: there are cases where the unit doc is
  // removed and we need to remove the lesson but omit the unit doc
  // which is why it's optional
  const unitDoc = getCollection(Unit.name).findOne({ _id: lessonDoc.unit })
  log(unitDoc)
  if (unitDoc) {
    // removes all linked phases but not global phases
    const phaseQuery = {
      _master: { $exists: false },
      unit: unitDoc._id,
      createdBy: userId
    }

    if (unitDoc.phases?.length) {
      phaseQuery._id = { $in: unitDoc.phases }
    }

    log('remove phase query', phaseQuery)
    result.phasesRemoved = getCollection(Phase.name).remove(phaseQuery)
    result.materialRemoved = removeAllMaterial({ unitDoc, userId })
    result.unitRemoved = getCollection(Unit.name).remove({ _id: unitDoc._id })
  }

  // if the unit doc is not found we still try to remove phases and material
  else {
    // removes all linked phases but not global phases
    const phaseQuery = {
      _master: { $exists: false },
      unit: lessonDoc.unit,
      createdBy: userId
    }

    log('remove phase query', phaseQuery)
    result.phasesRemoved = getCollection(Phase.name).remove(phaseQuery)
  }

  result.lessonRemoved = getCollection(Lesson.name).remove({ _id: lessonId })
  log(result)

  return result
}

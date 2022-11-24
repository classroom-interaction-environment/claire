import { Lesson } from '../Lesson'
import { LessonRuntime } from '../runtime/LessonRuntime'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { getCollection } from '../../../../api/utils/getCollection'
import { LessonHelpers } from '../LessonHelpers'
import { DocNotFoundError } from '../../../../api/errors/types/DocNotFoundError'

/**
 * Removes / deletes a lesson by a given _id. Removes all related documents, too.
 *
 * @param options {object}
 * @param options.lessonId {string} the _id of the lesson to be deleted
 * @param options.lessonDoc {object} the lesson doc of the lesson to be deleted
 * @param options.userId {string} the user of which in behalf to call
 * @param options.log {function=} optional log to be passed
 * @return {{
 *     lessonRemoved: number,
 *     unitRemoved: number,
 *     phasesRemoved: number,
 *     materialRemoved: number,
 *     runtimeDocsRemoved: number,
 *     beamerRemoved: number
 * }}
 */

export const removeLesson = (options) => {
  const { userId, log } = options
  let lessonId = options.lessonId
  let lessonDoc = options.lessonDoc

  if (!lessonDoc) {
    const docsForTeacher = LessonHelpers.docsForTeacher({ userId, lessonId })
    lessonDoc = docsForTeacher.lessonDoc
  }

  // if still not existent....
  if (!lessonDoc) {
    throw new DocNotFoundError('removeLesson.noLessonById', { lessonId, userId })
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

  log('remove runtime docs')
  const removeRuntimeArgs = { lessonId, userId }
  result.runtimeDocsRemoved = LessonRuntime.removeDocuments(removeRuntimeArgs)
  result.beamerRemoved = LessonRuntime.resetBeamer(removeRuntimeArgs)

  // XXX: there are cases where the unit doc is
  // removed and we need to remove the lesson but omit the unit doc
  // which is why it's optional
  const unitDoc = getCollection(Unit.name).findOne({ _id: lessonDoc.unit })
  log('has unitdoc?', unitDoc)

  if (unitDoc) {
    // removes all linked phases but not global phases
    const phaseQuery = createPhaseQuery({ userId, unitId: unitDoc._id })

    if (unitDoc.phases?.length) {
      phaseQuery._id = { $in: unitDoc.phases }
    }

    log('remove phase query', phaseQuery)
    result.phasesRemoved = getCollection(Phase.name).remove(phaseQuery)
    result.materialRemoved = LessonRuntime.removeAllMaterial({ unitDoc, userId })
    result.unitRemoved = getCollection(Unit.name).remove({ _id: unitDoc._id, _master: { $exists: false } })
  }

  // If the unit doc is not found we still try to remove phases and material.
  // Removes all linked phases but not global phases.
  else {
    const phaseQuery = createPhaseQuery({ userId, unitId: lessonDoc.unit })
    log('remove phase query', phaseQuery)
    result.phasesRemoved = getCollection(Phase.name).remove(phaseQuery)
  }

  result.lessonRemoved = getCollection(Lesson.name).remove({ _id: lessonId })
  log(result)

  return result
}

/**
 * @private
 * @param userId {string}
 * @param unitId {string}
 * @return {{unit, createdBy, _master: {$exists: boolean}}}
 */
const createPhaseQuery = ({ userId, unitId }) => ({
  _master: { $exists: false },
  unit: unitId,
  createdBy: userId
})

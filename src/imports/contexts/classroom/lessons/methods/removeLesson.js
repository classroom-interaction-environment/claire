import { Lesson } from '../Lesson'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { getCollection } from '../../../../api/utils/getCollection'
import { getDocsForMember } from '../helpers/getDocsForMember'
import { removeDocuments } from '../runtime/removeDocuments'
import { resetBeamer } from '../runtime/resetBeamer'
import { removeGroups } from '../runtime/resetGroups'
import { createRemoveAllMaterial } from '../../../material/createRemoveAllMaterial'
import { noop } from 'bootstrap/js/src/util'

const removeAllMaterial = createRemoveAllMaterial({ isCurriculum: false })

/**
 * Removes / deletes a lesson by a given _id. Removes all related documents, too.
 *
 * @param lessonId {string} the _id of the lesson to be deleted
 * @param lessonDoc {object} the _id of the lesson to be deleted
 * @param userId {string} the user of which in behalf to call
 * @param log {function=} optional log to be passed
 * @return {Promise<{
 *     lessonRemoved: number,
 *     unitRemoved: number,
 *     phasesRemoved: number,
 *     materialRemoved: number,
 *     runtimeDocsRemoved: number,
 *     beamerRemoved: number
 * }>}
 */
export const removeLesson = async ({ userId, lessonId, lessonDoc, log = noop }) => {
  log('get lesson doc')
  const doc = lessonDoc ? lessonDoc : (await getDocsForMember({ lessonId, userId })).lessonDoc
  const result = {
    lessonRemoved: 0,
    unitRemoved: 0,
    phasesRemoved: 0,
    materialRemoved: 0,
    runtimeDocsRemoved: 0,
    beamerRemoved: 0,
    groupsRemoved: 0
  }

  lessonId = doc._id

  log('remove runtime docs', { lessonId, userId })
  result.runtimeDocsRemoved = await removeDocuments({ lessonId, userId })
  result.beamerRemoved = await resetBeamer({ lessonId, userId })

  // XXX: there are cases where the unit doc is
  // removed and we need to remove the lesson but omit the unit doc
  // which is why it's optional
  const unitDoc = await getCollection(Unit.name).findOneAsync({ _id: doc.unit })
  log('has unitDoc?', unitDoc ? unitDoc._id : false)

  if (unitDoc) {
    // removes all linked phases but not global phases
    const phaseQuery = createPhaseQuery({ userId, unitId: unitDoc._id })

    if (unitDoc.phases?.length) {
      phaseQuery._id = { $in: unitDoc.phases }
    }

    log('remove phase query', phaseQuery)
    result.phasesRemoved = await getCollection(Phase.name).removeAsync(phaseQuery)
    result.unitRemoved = await getCollection(Unit.name).removeAsync({ _id: unitDoc._id, _master: { $exists: false } })
    result.materialRemoved = await removeAllMaterial({ unitDoc, userId })

    const unitId = unitDoc._id
    result.groupsRemoved = await removeGroups({ unitId })
  }

    // If the unit doc is not found we still try to remove phases and material.
  // Removes all linked phases but not global phases.
  else {
    const phaseQuery = createPhaseQuery({ userId, unitId: lessonDoc.unit })
    log('remove phase query', phaseQuery)
    result.phasesRemoved = await getCollection(Phase.name).removeAsync(phaseQuery)
  }

  result.lessonRemoved = await getCollection(Lesson.name).removeAsync({ _id: lessonId })
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

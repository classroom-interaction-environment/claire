import { Meteor } from 'meteor/meteor'
import { Lesson } from '../Lesson'
import { SchoolClass } from '../../schoolclass/SchoolClass'
import { Phase } from '../../../curriculum/curriculum/phase/Phase'
import { Unit } from '../../../curriculum/curriculum/unit/Unit'
import { LessonErrors } from '../LessonErrors'
import { checkIsTeacher } from '../helpers/checkIsTeacher'
import { getCollection } from '../../../../api/utils/getCollection'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { createDocCloner } from '../../../../api/utils/document/createDocCloner'

const getClassDoc = createDocGetter(SchoolClass)
const getPhaseDoc = createDocGetter(Phase)
const getUnitDoc = createDocGetter(Unit)

// for creating local copies of masters
const clonePhase = createDocCloner(Phase)
const cloneUnit = createDocCloner(Unit)
const isCustomUnit = (unitDoc = {}) => unitDoc.pocket === '__custom__'
/**
 * Creates a new lesson for a unit and creates a local copy of the unit plus
 * it's phases and tasks (but not other materials).
 * The unit and phases are copied in order to be able to be subject of change
 * in the preparation of the upcoming lesson.
 *
 * @param classId The _id of the SchoolClass of which this lesson applies
 * @param unit The _id of the unit for which this lesson is created
 * @param userId The _id of the user on which behalf this method is scoped
 * @return {{ lessonId: String, unitId: String }} the _id values of the newly created lesson and unit
 */

export const createLesson = function createLesson ({ classId, unit, userId } = {}) {
  // check class membership at very first, because
  // only class teachers and admins can create a new lesson
  const classDoc = getClassDoc(classId)
  checkIsTeacher({ userId, classDoc })

  const unitDoc = getUnitDoc(unit)

  let finalUnitId
  let finalUnitDoc

  // custom units require no cloning as there is no "original"
  if (isCustomUnit(unitDoc)) {
    finalUnitId = unit
    finalUnitDoc = unitDoc
  }

  // oherwise clone the original unit if it's not a custom unit
  else {
    finalUnitId = cloneUnit(unit)
    finalUnitDoc = getUnitDoc(finalUnitId)
  }

  // clone all referenced phases and make new phase point to new unit
  // and the new unit contain the new phases
  const modifier = { $set: { unit: finalUnitId } }
  const newPhases = (finalUnitDoc.phases || []).map(phaseId => clonePhase(phaseId, modifier))

  if (finalUnitDoc.phases && finalUnitDoc.phases.length !== newPhases.length) {
    throw new Meteor.Error('errors.unexpected', JSON.stringify({
      expected: finalUnitDoc.phases,
      actual: newPhases
    }))
  }

  newPhases.forEach(phaseId => {
    const phaseDoc = getPhaseDoc(phaseId)
    if (phaseDoc.unit === unit) {
      throw new Meteor.Error(LessonErrors.unexpectedPhaseLink, {
        phaseId,
        expected: finalUnitId,
        actual: unit
      })
    }
  })

  if (newPhases && newPhases.length > 0) {
    getCollection(Unit.name).update(finalUnitDoc, {
      $set: {
        phases: newPhases,
        _original: unit
      }
    })
  }

  // create the lesson with the new and old unit referenced
  const lessonId = getCollection(Lesson.name).insert({
    classId,
    unit: finalUnitId,
    unitOriginal: unit
  })

  return { lessonId, unitId: finalUnitId }
}

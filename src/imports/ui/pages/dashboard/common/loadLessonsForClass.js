import { loadIntoCollection } from '../../../../infrastructure/loading/loadIntoCollection'
import { Lesson } from '../../../../contexts/classroom/lessons/Lesson'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../contexts/curriculum/curriculum/pocket/Pocket'

/**
 * Loads lessons for a given classId, including units and pockets
 * @param classId {string} _id of the related schoolClass
 * @param onError {function} handler for errors
 * @return {Promise<boolean>} resolves to false if load was skipped
 *    or true if done (independent from errors)
 */
export const loadLessonsForClass = async ({ classId, onError }) => {
  const lessonArgs = { classId }
  const lessonDocs = await loadIntoCollection({
    name: Lesson.methods.my,
    args: lessonArgs,
    collection: getLocalCollection(Lesson.name),
    failure: onError
  })

  const UnitCollection = getLocalCollection(Unit.name)
  const lessonIds = []

  // skip all units that already have been loaded
  lessonDocs.forEach(doc => {
    if (UnitCollection.find({ _id: doc.unit }).count() === 0) {
      lessonIds.push(doc._id)
    }
  })

  // only load units if we have none anymore
  let unitDocs

  if (lessonIds.length > 0) {
    unitDocs = await loadIntoCollection({
      name: Lesson.methods.units,
      args: { lessonIds },
      collection: UnitCollection,
      failure: onError
    })
  }
  else {
    unitDocs = []
  }

  const PocketCollection = getLocalCollection(Pocket.name)
  const pocketIds = []
  unitDocs.forEach(doc => {
    if (PocketCollection.find({ _id: doc.pocket }).count() === 0) {
      pocketIds.push(doc.pocket)
    }
  })

  if (pocketIds.length > 0) {
    await loadIntoCollection({
      name: Pocket.methods.all,
      args: { ids: pocketIds },
      collection: PocketCollection,
      failure: onError
    })
  }

  return true
}
import { $in } from '../../../../../../api/utils/query/inSelector'
import { Meteor } from 'meteor/meteor'
import { Unit } from '../../../../../../contexts/curriculum/curriculum/unit/Unit'
import { $nin } from '../../../../../../api/utils/query/notInSelector'
import { getCollection } from '../../../../../../api/utils/getCollection'
import { getLocalCollection } from '../../../../../../infrastructure/collection/getLocalCollection'

const selectedEntriesSort = { sort: { title: 1 } }

/**
 * Creates a query for material that can be added from a list but is not currently
 * added as part of the unit.
 *
 * @param viewState
 * @param unitDoc
 * @param unitDocOriginal
 * @param userId
 * @return {*|null}
 */
export const selectEntries = function (viewState, unitDoc, unitDocOriginal, userId = Meteor.userId()) {
  const { collection, field } = viewState

  let originalUnit = unitDocOriginal || getCollection(Unit.name).findOne(unitDoc._original) || getLocalCollection(Unit.name).findOne(unitDoc._original)

  if (!originalUnit) {
    // send a warning only in case the unit is not a master doc
    if (!unitDoc._master) {
      console.warn(`Found no original unit [${unitDoc._original}] for current unit [${unitDoc._id}]`)
    }
    originalUnit = unitDoc // XXX fixes custom unit bug
  }

  const target = (unitDoc[field] || [])
  const originalTarget = (originalUnit[field] || [])

  let cursor

  if (target) {
    // select entries are defined by the following selection:

    // - my global material (non-clones)
    // TODO include, once we have a working concept of how to
    // TODO handle global custom material
    //const myGlobals = {
    //  createdBy: userId,
    //  _original: { $exists: false },
    //  _id: $nin(target)
    //}

    // - master material for this unit, that is not in the list but in the original unit
    const masterDocs = {
      _master: true,
      _id: Object.assign({}, $nin(target), $in(originalTarget))
    }

    // - my clones of material not in list and which original is part of this unit
    const myClones = {
      createdBy: userId,
      _id: $nin(target),
      _original: $in(originalTarget)
    }

    const finalQuery = { $or: [myClones, masterDocs] }
    cursor = collection.find(finalQuery, selectedEntriesSort)
  }

  return cursor && cursor.count() > 0 ? cursor : null
}

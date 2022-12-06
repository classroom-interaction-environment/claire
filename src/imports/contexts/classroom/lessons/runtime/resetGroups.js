import { check, Match } from 'meteor/check'
import { getCollection } from '../../../../api/utils/getCollection'
import { Group } from '../../group/Group'

/**
 * Resets all groups of a given unit.
 * Removes all ad-hoc groups.
 * @param options {object}
 * @param options.lessonId {string}
 * @param options.unitId {string}
 * @return {number} number of updated documents
 */
export const resetGroups = (options) => {
  check(options, Match.ObjectIncluding({
    lessonId: String,
    unitId: String
  }))

  return {
    updated: updateGroups(options),
    removed: removeAdhocGroups(options)
  }
}

const updateGroups = ({ lessonId, unitId }) => {
  const query = { lessonId, unitId }
  const transform = { $set: { visible: [] } }
  const updateOptions = { multi: true }
  return getCollection(Group.name).update(query, transform, updateOptions)
}

const removeAdhocGroups = ({ lessonId }) => {
  const query = { lessonId, unitId: { $exists: false } }
  return getCollection(Group.name).remove(query)
}

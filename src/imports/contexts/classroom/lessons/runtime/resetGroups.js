import { check, Match } from 'meteor/check'
import { getCollection } from '../../../../api/utils/getCollection'
import { Group } from '../../group/Group'

/**
 * Resets all groups of a given lesson.
 * @param options {object}
 * @param options.lessonId {string}
 * @return {number} number of updated documents
 */
export const resetGroups = (options) => {
  check(options, Match.ObjectIncluding({
    lessonId: String
  }))
  const { lessonId } = options
  const query = { lessonId }
  const transform = { $set: { visible: [] } }
  const updateOptions = { multi: true }

  return getCollection(Group.name).update(query, transform, updateOptions)
}

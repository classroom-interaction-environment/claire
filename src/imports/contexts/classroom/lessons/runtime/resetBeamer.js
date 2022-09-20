import { check } from 'meteor/check'
import { Beamer } from '../../../beamer/Beamer'
import { getCollection } from '../../../../api/utils/getCollection'

// Devnote: Could be easily extended by parameters like referenceId, context, itemId, classId

/**
 * Resets all beamer settings that are related to the given setting and user.
 * @param lessonId the id of the lesson to which the beamer settings should be reset
 * @param userId the user to whom the respective beamer doc is associated
 * @return {Number} the amount of references, that have been reset
 */
export const resetBeamer = function resetBeamer ({ lessonId, userId } = {}) {
  check(lessonId, String)
  check(userId, String)

  const BeamerCollection = getCollection(Beamer.name)
  const beamerDoc = BeamerCollection.findOne({ createdBy: userId })

  // no beamer doc exists
  if (!beamerDoc) return -1

  if (beamerDoc.references && beamerDoc.references.length > 0) {
    // let all references remain, that are not associated with the lessonId
    const updatedReferences = beamerDoc.references.filter(ref => ref.lessonId !== lessonId)
    const diff = beamerDoc.references.length - updatedReferences.length

    if (diff > 0) {
      const modifier = { $set: { references: updatedReferences } }
      const updated = BeamerCollection.update(beamerDoc._id, modifier)
      return updated && diff
    }

    // there were references but none are related to lessonId
    return 0
  }

  // beamer doc exists but there a no references to update
  return 0
}

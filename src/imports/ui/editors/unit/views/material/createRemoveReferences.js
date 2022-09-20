import { Meteor } from 'meteor/meteor'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'

/**
 * Iterates all unit's phases to look for a reference by given target material
 * and removes it. Required to unlink removed material from Phases to avoid
 * dead links.
 *
 * @param PhaseCollection {Mongo.Collection}
 * @return {Function}
 */
export const createRemoveReferences = PhaseCollection => ({ phases, field, targetId }, callback) => {
    phases.forEach(phaseId => {
      const phaseDoc = PhaseCollection.findOne(phaseId)

      if (phaseDoc.references) {
        const filteredReferences = phaseDoc.references.filter(ref => {
          const { document } = ref
          return (document !== targetId)
        })

        // if there were references found and filtered
        // we update the phases doc, otherwise, we are good here
        if (filteredReferences.length !== phaseDoc.references.length) {
          phaseDoc.references = filteredReferences

          updateContextDoc({
            context: Phase,
            _id: phaseId,
            doc: { references: filteredReferences },
            failure: err => callback(err),
            success: res => {
              if (!res) {
                return res
                  ? callback(undefined, phaseDoc)
                  : callback(new Meteor.Error('errors.updateFailed', Phase.name, { phaseId }))
              }
            }
          })
        }
      }
    })
  }

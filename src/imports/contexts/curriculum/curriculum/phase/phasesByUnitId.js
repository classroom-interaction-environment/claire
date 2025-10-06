import { getCollection } from '../../../../api/utils/getCollection'
import { Phase } from './Phase'

/**
 * Get all phases by unit ID.
 * @param unitId
 * @return {Promise<Phase[]>}
 */
export const phasesByUnitId = unitId => {
  return getCollection(Phase.name).find({ unit: unitId }).fetchAsync()
}

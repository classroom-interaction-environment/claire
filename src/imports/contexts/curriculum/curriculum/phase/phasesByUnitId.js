import { getCollection } from '../../../../api/utils/getCollection'
import { Phase } from './Phase'

let collection

export const phasesByUnitId = unitId => {
  if (!collection) collection = getCollection(Phase.name)

  return collection.find({ unit: unitId }).fetch()
}

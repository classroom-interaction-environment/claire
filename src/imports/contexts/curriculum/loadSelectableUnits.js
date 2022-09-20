import { Unit } from './curriculum/unit/Unit'
import { Pocket } from './curriculum/pocket/Pocket'
import { Dimension } from './curriculum/dimension/Dimension'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { loadIntoCollection } from '../../infrastructure/loading/loadIntoCollection'

const toDocId = doc => doc._id

/**
 * Loads master units and dependent pockets and dimensions to build a unit select list.
 * Excludes
 *  - existing local documents
 *  - custom units
 *  - empty pockets
 *  - non-linked dimensions
 * @param onError
 * @return {Promise<void>}
 */
export const loadSelectableUnits = async ({ onError }) => {
  const UnitCollection = getLocalCollection(Unit.name)
  const skip = UnitCollection.find().map(toDocId)

  await loadIntoCollection({
    name: Unit.methods.master,
    args: { skip },
    collection: UnitCollection,
    failure: onError
  })

  const PocketCollection = getLocalCollection(Pocket.name)
  const DimensionCollection = getLocalCollection(Dimension.name)
  const skipPockets = new Set(PocketCollection.find().map(toDocId))
  const skipDimensions = new Set(DimensionCollection.find().map(toDocId))
  const pocketIds = new Set()
  const dimensionIds = new Set()

  UnitCollection.find().forEach(unitDoc => {
    if (!skipPockets.has(unitDoc.pocket) && unitDoc.pocket !== '__custom__') {
      pocketIds.add(unitDoc.pocket)
    }
    if (unitDoc.dimensions) {
      unitDoc.dimensions.forEach(dimensionId => {
        if (!skipDimensions.has(dimensionId)) {
          dimensionIds.add(dimensionId)
        }
      })
    }
  })

  if (pocketIds.size > 0) {
    await loadIntoCollection({
      name: Pocket.methods.master,
      args: { ids: [...pocketIds] },
      collection: PocketCollection,
      failure: onError
    })
  }

  if (dimensionIds.size > 0) {
    await loadIntoCollection({
      name: Dimension.methods.master,
      args: { ids: [...dimensionIds] },
      collection: DimensionCollection,
      failure: onError
    })
  }
}

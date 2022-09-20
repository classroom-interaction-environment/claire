import { check } from 'meteor/check'
import { getCollection } from '../../api/utils/getCollection'
import { createMaterialQuery } from './createMaterialQuery'
import { unitMaterialIds } from '../curriculum/curriculum/unit/unitMaterialIds'

/**
 * Creates a function that removes all linked Material for a given unit doc.
 * Note, that if the material is linked elsewhere this method can have severe
 * consequences.
 *
 * @locus server
 * @param {Boolean} isCurriculum determines the query for the material
 * @return {Function} a function that removes all Material for a given Unit doc
 */
export const createRemoveAllMaterial = ({ isCurriculum = false } = {}) => {
  check(isCurriculum, Boolean)

  /**
   * Removes all material
   */
  return function removeAllMaterial ({ unitDoc, userId }) {
    const unitMaterial = unitMaterialIds(unitDoc)

    Object.keys(unitMaterial).forEach(materialContext => {
      const materialDocIds = unitMaterial[materialContext]

      if (!materialDocIds?.length) {
        unitMaterial[materialContext] = 0
        return
      }

      const MaterialCollection = getCollection(materialContext)
      const materialQuery = createMaterialQuery(unitMaterial[materialContext], userId, isCurriculum)

      unitMaterial[materialContext] = MaterialCollection.remove(materialQuery)
    })

    return unitMaterial
  }
}

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
  return async ({ unitDoc, userId }) => {
    const unitMaterial = unitMaterialIds(unitDoc)
    const materialContextNames = Object.keys(unitMaterial)

    for (const materialCtxName of materialContextNames) {
      const materialDocIds = unitMaterial[materialCtxName]

      if (materialDocIds?.length) {
        const materialQuery = createMaterialQuery(unitMaterial[materialCtxName], userId, isCurriculum)
        unitMaterial[materialCtxName] = await getCollection(materialCtxName).removeAsync(materialQuery)
      }
      else {
        unitMaterial[materialCtxName] = 0
      }
    }

    return unitMaterial
  }
}

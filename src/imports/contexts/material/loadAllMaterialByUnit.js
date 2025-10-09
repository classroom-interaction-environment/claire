import { onServer } from '../../api/utils/archUtils'
import { loadMaterial } from './loadMaterial'
import { unitMaterialIds } from '../curriculum/curriculum/unit/unitMaterialIds'

/**
 * Server-side method to load all materials for a given unit.
 *
 * TODO ADD SKIP PARAM WITH ID LIST TO SKIP ALREADY LOADED DOCS
 * @param unitDoc
 * @param userId
 * @return {*|{}}
 */
export const loadAllMaterialByUnit = onServer(async (unitDoc) => {
  const unitMaterial = unitMaterialIds(unitDoc)
  const dependencies = {}
  const material = {}
  await loadMaterial({
    source: unitMaterial,
    destination: material,
    dependencies: dependencies
  })
  await loadMaterial({
    source: dependencies,
    destination: material
  })

  return material
})

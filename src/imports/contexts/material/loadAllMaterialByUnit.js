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
export const loadAllMaterialByUnit = onServer((unitDoc) => {
  const unitMaterial = unitMaterialIds(unitDoc)
  const dependencies = {}
  const material = {}
  loadMaterial({
    source: unitMaterial,
    destination: material,
    dependencies: dependencies
  })
  loadMaterial({
    source: dependencies,
    destination: material
  })

  return material
})


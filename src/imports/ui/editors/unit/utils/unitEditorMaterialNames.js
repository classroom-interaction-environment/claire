import { Material } from '../../../../contexts/material/Material'
import { isMetaMaterial } from './isMetaMaterial'

export const unitEditorMaterialNames = () => {
  const allMaterial = []
  Material.forEach(ctx => allMaterial.push(ctx))
  return allMaterial
    .filter(ctx => !isMetaMaterial(ctx))
    .map(({ name, label, fieldName }) => ({ name, label, fieldName }))
}

import { Material } from '../../../material/Material'

export const unitMaterialCount = unitDoc => {
  let count = 0

  Material.forEach(function (materialContext) {
    const { fieldName } = materialContext
    const length = unitDoc[fieldName]?.length
    if (length) count += length
  })

  return count
}
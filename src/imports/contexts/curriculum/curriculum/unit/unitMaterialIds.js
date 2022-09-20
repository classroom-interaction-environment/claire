import { Material } from '../../../material/Material'
import { Unit } from './Unit'
import { Phase } from '../phase/Phase'

export const unitMaterialIds = unitDoc => {
  if (Material.size() === 0) {
    throw new Error('Material is not initialized')
  }

  const materialIds = {}

  Material.forEach(context => {
    if (![Unit, Phase].includes(context)) {
      materialIds[context.name] = unitDoc[context.fieldName]
    }
  })

  return materialIds
}
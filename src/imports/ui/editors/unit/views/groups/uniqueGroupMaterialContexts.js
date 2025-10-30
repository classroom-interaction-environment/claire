import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'

export const uniqueGroupMaterialContexts = (...contexts) => {
  const materialContexts = getMaterialContexts()
  const allContexts = contexts.concat(materialContexts)
  const set = new Set(allContexts)
  return [...set.values()]
}
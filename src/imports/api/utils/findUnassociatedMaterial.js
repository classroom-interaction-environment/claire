import { Material } from '../../contexts/material/Material'
import { getCollection } from './getCollection'
import { initContext } from '../../startup/client/contexts/initContext'
import { Phase } from '../../contexts/curriculum/curriculum/phase/Phase'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'

initContext(Phase)

function findEntries (unitDoc, context) {
  const { name } = context
  const fieldName = Material.getFieldnameForContext(name)
  const contextName = Material.getContextNameForField(fieldName)
  const field = unitDoc[fieldName]

  if (!Array.isArray(field) || contextName === Phase.name) return

  const entries = []

  field.forEach(referenceId => {
    const refDoc = {
      document: referenceId,
      collection: name
    }
    const query = {
      unit: unitDoc._id,
      references: {
        $elemMatch: refDoc
      }
    }

    const refCount = getCollection(Phase.name).find(query).count() ||
      getLocalCollection(Phase.name).find(query).count()

    if (!refCount) {
      entries.push(refDoc)
    }
  })

  return entries
}

export const findUnassociatedMaterial = unitDoc => {
  const unassociatedMaterial = []
  Material.forEach(materialContext => {
    const entries = findEntries(unitDoc, materialContext, unassociatedMaterial)
    if (!entries || entries.length === 0) return
    unassociatedMaterial.push(...entries)
  })
  return unassociatedMaterial
}

/* Removes all references in units / tasks that have no corresponding file.
 */

if (Meteor.settings.patch?.removeDeadReferences) {
  console.debug('[removeDeadReferences]: run')
  Meteor.startup(() => {
    import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
    import { Pocket } from '../../../../contexts/curriculum/curriculum/pocket/Pocket'
    import { getCollection } from '../../../../api/utils/getCollection'
    import { unitMaterialIds } from '../../../../contexts/curriculum/curriculum/unit/unitMaterialIds'
    import { Material } from '../../../../contexts/material/Material'
    const remove = {}
    const addToRemove = (pocket, unit, ctxName, _id) => {
      const ctx = Material.get(ctxName)
      if (!ctx) {
        throw new Error(`Expected ctx for ${ctxName}`)
      }

      const name = ctx.fieldName
      console.warn(pocket.title, '->', unit._id, unit.title, name, _id)

      if (!remove[unit._id]) {
        remove[unit._id] = {}
      }

      if (!remove[unit._id][name]) {
        remove[unit._id][name] = []
      }
      remove[unit._id][name].push(_id)
    }

    const PocketCollection = getCollection(Pocket.name)
    const UnitCollection = getCollection(Unit.name)

    UnitCollection.find({ _master: true }).forEach(unitDoc => {
      const pocketDoc = PocketCollection.findOne(unitDoc.pocket)
      const material = unitMaterialIds(unitDoc)

      Object.entries(material).forEach(([materialName, linkedIds]) => {
        if (!linkedIds || linkedIds.length === 0) { return }

        const collection = getCollection(materialName)
        linkedIds.forEach(materialId => {
          if (collection.find({ _id: materialId }).count() === 0) {
            addToRemove(pocketDoc, unitDoc, materialName, materialId)
          }
        })
      })
    })

    Object.entries(remove).forEach(([unitId, materials]) => {
      const query = { _id: unitId }
      const transform = { $pullAll: {} }

      Object.entries(materials).forEach(([name, idSet]) => {
        transform.$pullAll[name] = idSet
      })

      console.debug('update unit', unitId, query, transform)
      UnitCollection.update(query, transform)
    })
  })
}

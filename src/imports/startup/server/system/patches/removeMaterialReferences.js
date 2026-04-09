import { Meteor } from 'meteor/meteor'
import { createLog } from '../../../../api/log/createLog'

/* Removes all references in units / tasks that have no corresponding file. */

if (Meteor.settings.patch?.removeDeadReferences) {
  Meteor.startup(async () => {
    const { Unit } = require('../../../../contexts/curriculum/curriculum/unit/Unit')
    const { Pocket } = require('../../../../contexts/curriculum/curriculum/pocket/Pocket')
    const { getCollection } = require('../../../../api/utils/getCollection')
    const { unitMaterialIds } = require('../../../../contexts/curriculum/curriculum/unit/unitMaterialIds')
    const { Material } = require('../../../../contexts/material/Material')

    const log = createLog({ name: 'patch/removeDeadReferences' })
    log('run')

    const remove = {}
    const addToRemove = (pocket, unit, ctxName, _id) => {
      const ctx = Material.get(ctxName)
      if (!ctx) {
        throw new Error(`Expected ctx for ${ctxName}`)
      }

      const name = ctx.fieldName
      log(pocket.title, '->', unit._id, unit.title, name, _id)

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
    const unitMasterDocs = await UnitCollection.find({ _master: true }).fetchAsync()
    for (const unitDoc of unitMasterDocs) {
      const pocketDoc = await PocketCollection.findOneAsync(unitDoc.pocket)
      const material = unitMaterialIds(unitDoc)
      const materialEntries = Object.entries(material).filter(([, linkedIds]) => linkedIds && linkedIds.length > 0)
      for (const [materialName, linkedIds] of materialEntries) {
        const collection = getCollection(materialName)

        for (const materialId of linkedIds) {
          if (await collection.countDocuments({ _id: materialId }) === 0) {
            addToRemove(pocketDoc, unitDoc, materialName, materialId)
          }
        }
      }
    }

    for (const [unitId, materials] of Object.entries(remove)) {
      const query = { _id: unitId }
      const transform = { $pullAll: {} }

      Object.entries(materials).forEach(([name, idSet]) => {
        transform.$pullAll[name] = idSet
      })

      log('update unit', unitId, query, transform)
      await UnitCollection.updateAsync(query, transform)
    }
  })
}

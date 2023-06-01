import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { i18n } from '../../../../../api/language/language'
import { Material } from '../../../../../contexts/material/Material'
import { Curriculum } from '../../../../../contexts/curriculum/Curriculum'
import { firstOption } from '../../../../../contexts/tasks/definitions/common/helpers'
import { getCollection } from '../../../../../api/utils/getCollection'
import { unitEditorMaterialNames } from '../../utils/unitEditorMaterialNames'
import { queryFromCollectionAndLocal } from '../../../../../api/utils/query/queryFromCollectionAndLocal'

const defaultSchema = Curriculum.getDefaultSchema()

export const phaseBaseSchema = Object.assign({}, defaultSchema, Phase.schema)
phaseBaseSchema['references.$.collection'].autoform = {
  firstOption: firstOption,
  options () {
    const unitId = AutoForm.getFieldValue('unit')
    if (!unitId) return []

    const UnitCollection = getCollection(Unit.name)
    const unitDoc = UnitCollection.findOne(unitId)

    return unitEditorMaterialNames().filter(option => {
      const field = option.fieldName
      const target = unitDoc[field]
      return target && target.length > 0
    }).map(({ name, label }) => {
      return { value: name, label: () => i18n.get(label) }
    })
  }
}

phaseBaseSchema['references.$.document'].autoform = {
  firstOption: firstOption,
  options () {
    const index = this.name.split('.')[1]
    const contextName = AutoForm.getFieldValue(`references.${index}.collection`)
    const unitId = AutoForm.getFieldValue('unit')

    if (!unitId || !contextName) return []

    const UnitCollection = getCollection(Unit.name)
    const unitDoc = UnitCollection.findOne(unitId)
    const context = Material.get(contextName)
    const targetIds = unitDoc[context.fieldName]
    const query = { _id: { $in: targetIds } }

    return queryFromCollectionAndLocal(contextName, query)
  }
}

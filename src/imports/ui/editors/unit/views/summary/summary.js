import { Template } from 'meteor/templating'
import { DocNotFoundError } from '../../../../../api/errors/types/DocNotFoundError'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { Objective } from '../../../../../contexts/curriculum/curriculum/objective/Objective'
import { Pocket } from '../../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { SchoolClass } from '../../../../../contexts/classroom/schoolclass/SchoolClass'
import { Curriculum } from '../../../../../contexts/curriculum/Curriculum'
import { FormModal } from '../../../../components/forms/modal/formModal'
import { dataTarget } from '../../../../utils/dataTarget'
import { toUpdateDoc } from '../../../../utils/toUpdateDoc'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { firstOption } from '../../../../../contexts/resources/web/lib/helpers'
import { dimensionOptions } from '../../../../../contexts/curriculum/curriculum/dimension/dimensionOptions'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import '../../../../renderer/phase/compact/compactPhases'
import '../../../../renderer/phase/nonphaseMaterial/nonPhaseMaterial'
import '../../../../renderer/objective/objective'
import '../../../../forms/treeselect/treeSelect'
import './summary.html'

/*******************************************************************************
 * The summary view contains a full overview of the unit's content.
 * It's purpose is to give the teacher a direct insight about the unit
 * and whether action is required to edit and improve the unit.
 *
 * Therefore it
 * - loads all the associated and unassociated material docs
 * -
 ******************************************************************************/

const API = Template.uesummary.setDependencies({
  contexts: [Unit, Dimension, Objective, Pocket]
})

const forms = {
  basicInfo: {
    doc (instance) {
      return instance.data.unitDoc
    },
    schema () {
      const defaultSchema = Curriculum.getDefaultSchema()
      return API.createSchema({
        title: defaultSchema.title,
        description: defaultSchema.description,
        period: Unit.schema.period
      })
    },
    onSubmit ({ doc, originalDoc, templateInstance }) {
      const updateDoc = toUpdateDoc(originalDoc, doc)

      return updateContextDoc({
        context: Unit,
        _id: originalDoc._id,
        doc: updateDoc,
        prepare: () => templateInstance.state.set('submitting', true),
        receive: () => templateInstance.state.set('submitting', false),
        failure: er => API.notify(er),
        success: () => API.notify(true)
      })
    }
  },
  dimensions: {
    doc (instance) {
      return instance.data.unitDoc
    },
    schema () {
      return API.createSchema({
        dimensions: {
          ...Unit.schema.dimensions,
          optional: true,
        },
        'dimensions.$': {
          ...Unit.schema['dimensions.$'],
          autoform: {
            firstOption: firstOption(),
            options: dimensionOptions({ collection: getLocalCollection(Dimension.name) })
          }
        }
      })
    },
    onSubmit ({ doc, originalDoc, templateInstance }) {
      const updateDoc = toUpdateDoc(originalDoc, doc)

      return updateContextDoc({
        context: Unit,
        _id: originalDoc._id,
        doc: updateDoc,
        prepare: () => templateInstance.state.set('submitting', true),
        receive: () => templateInstance.state.set('submitting', false),
        failure: er => API.notify(er),
        success: () => API.notify(true)
      })
    }
  },
  objectives: {
    doc (instance) {
      return instance.data.unitDoc
    },
    schema () {
      return API.createSchema({
        objectives: {
          ...Unit.schema.objectives,
          optional: true,
          autoform: {
            type: 'treeSelect',
            renderer: 'objective',
            documents: () => buildObjectiveTree(getLocalCollection(Objective.name).find().fetch())
          }
        },
        'objectives.$': {
          type: String
        }
      })
    },
    onSubmit ({ doc, originalDoc, templateInstance }) {
      debugger
      const updateDoc = toUpdateDoc(originalDoc, doc)

      return updateContextDoc({
        context: Unit,
        _id: originalDoc._id,
        doc: updateDoc,
        prepare: () => templateInstance.state.set('submitting', true),
        receive: () => templateInstance.state.set('submitting', false),
        failure: er => API.notify(er),
        success: () => API.notify(true)
      })
    }
  }
}

const buildObjectiveTree = (docs, parentId = null) => {
  return docs
    .filter(doc => doc.parent == parentId)
    .map(doc => ({
      ...doc,
      children: buildObjectiveTree(docs, doc._id)
    }))
}

Template.uesummary.onCreated(async function () {
  const instance = this
  const { data } = instance
  const { unitDoc, classDoc, pocketDoc, preview } = data

  // first, make a sanity check for all required docs. It's job of the parent
  // component to provide these, so we can safely fail here with fatal

  if (!unitDoc) {
    return API.fatal(new DocNotFoundError(undefined, { unitDoc }))
  }
  // detect all material, that is linked to the unit but not to any phase of it
  instance.state.set({ preview })

  // create on overview list of any basic information

  const baseData = []

  // add classDoc data only if we are working on a copy; not on a master
  baseData.push({
    icon: SchoolClass.icon,
    label: SchoolClass.label,
    value: classDoc?.title
  })

  // add pocketDoc data only if we are not working on a custom unit
  baseData.push({
    icon: Pocket.icon,
    label: Pocket.label,
    value: pocketDoc?.title ?? API.translate('curriculum.customUnit')
  })

  // always add period and description
  baseData.push({
    icon: 'clock',
    label: 'curriculum.period',
    value: `${unitDoc.period} ${API.translate('time.minutes')}`
  }, {
    icon: 'align-justify',
    label: 'common.description',
    value: unitDoc.description || API.translate('common.noDescription')
  })

  instance.state.set({ baseData })

  await loadIntoCollection({
    name: Dimension.methods.editor,
    collection: getLocalCollection(Dimension.name),
    success: () => instance.state.set('dimensionsComplete', true)
  })
  await loadIntoCollection({
    name: Objective.methods.editor,
    collection: getLocalCollection(Objective.name),
    success: () => instance.state.set('objectivesComplete', true)
  })

  // if unit doc changes, we update the associated dimensions
  instance.autorun(() => {
    const unitDoc = Template.currentData().unitDoc
    const dimensionIds = unitDoc?.dimensions || []
    const dimensions = getLocalCollection(Dimension.name).find({ _id: { $in: dimensionIds } }).fetch()
    const objectiveIds = unitDoc?.objectives || []
    const objectives = getLocalCollection(Objective.name).find({ _id: { $in: objectiveIds } }).fetch()
    instance.state.set({ dimensions, objectives })
  })
})

Template.uesummary.helpers({
  baseData () {
    return Template.getState('baseData')
  },
  state (name) {
    return Template.getState(name)
  },
  loadComplete () {
    return API.initComplete()
  },
  objectivesComplete () {
    return Template.getState('objectivesComplete')
  },
  dimensionsComplete () {
    return Template.getState('dimensionsComplete')
  },
  dimensions () {
    return Template.getState('dimensions')
  },
  objectives () {
    return Template.getState('objectives')
  },
  isPreview () {
    return Template.getState('preview')
  }
})

Template.uesummary.events({
  'click .uesummary-edit-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    const ctx = forms[target]
    const originalDoc = ctx.doc(templateInstance)
    FormModal.show({
      title: SchoolClass.label,
      action: 'update',
      load: ctx.load,
      schema: ctx.schema(),
      doc: originalDoc,
      onError: API.failure,
      custom: ctx.handlers,
      onClosed: ctx.onClosed,
      onSubmit: ({ doc }) => {
        return ctx.onSubmit({ originalDoc, doc, templateInstance })
      }
    })
  }
})

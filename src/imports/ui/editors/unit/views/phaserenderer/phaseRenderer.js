import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Curriculum } from '../../../../../contexts/curriculum/Curriculum'
import { ContextRegistry } from '../../../../../infrastructure/context/ContextRegistry'
import { Schema } from '../../../../../api/schema/Schema'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { formIsValid } from '../../../../components/forms/formUtils'
import { getCollection } from '../../../../../api/utils/getCollection'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'

import './phaseRenderer.html'

const defaultSchema = Curriculum.getDefaultSchema()
const SocialStateType = Curriculum.SocialStateType
const baseSchema = Object.assign({}, defaultSchema, Phase.schema)
let editSchema

const API = Template.uephaseRenderer.setDependencies()

Template.uephaseRenderer.onCreated(function onuePhaseRendererCreated () {
  const instance = this
  instance.autorun(() => {
    const data = Template.currentData()
    const { phaseDoc } = data
    instance.state.set('unitDoc', data.unitDoc)
    instance.state.set('phaseDoc', phaseDoc)

    if (phaseDoc && phaseDoc.references) {
      const references = phaseDoc.references
        .sort((a, b) => a.collection.localeCompare(b.collection))
        .map(refObj => {
          const { collection } = refObj
          const { document } = refObj
          if (!collection || !document) {
            return null
          }
          const context = ContextRegistry.get(collection)
          return {
            icon: context.icon,
            label: context.label,
            isFilesCollection: context.isFilesCollection,
            doc: getCollection(collection).findOne(document)
          }
        })
      instance.state.set('references', references)
    } else {
      instance.state.set('references', null)
    }
  })
})

Template.uephaseRenderer.helpers({
  edit (fieldName) {
    return Template.getState('edit') === fieldName
  },
  editSchema () {
    return editSchema
  },
  submitting () {
    return Template.getState('submitting')
  },
  context (field) {
    const editField = Template.getState('edit')
    const submitField = Template.getState('submitting')
    const phaseDoc = Template.getState('phaseDoc')
    return {
      field: field,
      label: baseSchema[field].label(),
      edit: editField === field,
      doc: phaseDoc,
      submitting: submitField === field
    }
  },
  socialState (value) {
    return SocialStateType.entry(value)
  },
  references (refObj) {
    return Template.getState('references')
  }
})

Template.ueprField.helpers({
  editSchema () {
    return editSchema
  }
})

Template.uephaseRenderer.events({
  'click .uephase-renderer-cancel-button' (event, templateInstance) {
    templateInstance.state.set('edit', null)
  },
  'click .uephase-renderer-edit-button' (event, templateInstance) {
    event.preventDefault()

    const $target = templateInstance.$(event.currentTarget)
    const fieldName = $target.data('field')
    const schemaObj = {
      [fieldName]: baseSchema[fieldName]
    }

    // also assign array fields .$
    // and object feld .$. to the schema
    const arrayField = `${fieldName}.$`
    Object.keys(baseSchema).forEach(key => {
      if (key.indexOf(arrayField) > -1) {
        schemaObj[key] = baseSchema[key]
      }
    })

    schemaObj.unit = Object.assign({}, baseSchema.unit, { autoform: { type: 'hidden' } })
    editSchema = Schema.create(schemaObj, { tracker: Tracker })
    templateInstance.state.set('edit', fieldName)
  },
  'submit #ueprEditFieldForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(editSchema, 'ueprEditFieldForm')
    if (!insertDoc) return

    const fieldName = templateInstance.state.get('edit')
    const phaseDoc = templateInstance.state.get('phaseDoc')

    updateContextDoc({
      context: Phase,
      _id: phaseDoc._id,
      doc: { [fieldName]: insertDoc[fieldName] },
      prepare: () => templateInstance.state.set('submitting', fieldName),
      receive: () => templateInstance.state.set('submitting', null),
      failure: er => API.notify(er),
      success: () => API.notify(true)
    })
  }
})

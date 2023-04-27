/* global AutoForm */
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Random } from 'meteor/random'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Item } from '../../../contexts/tasks/definitions/items/Item'
import { Form } from '../../components/forms/Form'
import { Schema } from '../../../api/schema/Schema'
import './itemRenderer.scss'
import './itemRenderer.html'
import { GroupMode } from '../../../contexts/classroom/group/GroupMode'

export const itemRenderer = 'itemRenderer'

const formInitialized = Form.initialized()
const instances = new Map()
const items = new ReactiveDict()
const values = new ReactiveDict()
const states = new ReactiveDict()
const rendererSchemas = new Map() // TODO make map

const ItemRendererState = {
  loading: 'loading',
  loadFailed: 'loadFailed',
  editing: 'editing',
  submit: 'submit',
  submissionFailed: 'submissionFailed',
  saved: 'saved',
  readOnly: 'readOnly'
}

const API = Template.itemRenderer.setDependencies({})

Template.itemRenderer.onCreated(function () {
  const instance = this
  instance.instanceId = Random.id()

  const count = instances.get(instance.data.itemId) || 0
  instances.set(instance.data.itemId, count + 1)

  instance.autorun(async function () {
    const data = Template.currentData()
    const itemInit = Item.isInitialized()

    if (!itemInit || !data || !data.meta || !Item.has(data.meta)) {
      return
    }

    const { onItemLoad, hasUnsavedData, itemId, page } = data

    // each item has a specific schema and sometimes even uses
    // a custom form component.
    // In order to pass down dynamic attributes to the schema
    // (like preview mode, lessonId, taskId, etc.)
    // we use the build() function that every item has
    // by definition.

    if (!rendererSchemas.has(itemId)) {
      const ctx = Item.get(data.meta)
      const buildSchema = ctx.build(data)

      if (typeof ctx.load === 'function') {
        await ctx.load()
      }

      rendererSchemas.set(itemId, Schema.create(buildSchema, { tracker: Tracker }))
    }

    // if we have no load function we are in preview mode and skip here
    // by setting the item data and ignore further processing
    if (typeof onItemLoad !== 'function') {
      return items.set(itemId, data)
    }

    API.log('onItemLoad', itemId)
    onItemLoad(itemId, (err, itemDoc) => {
      if (err) {
        states.set(itemId, ItemRendererState.loadFailed)
        instance.state.set({ error: err })
      }
      else {
        if (itemDoc) {
          states.set(itemId, ItemRendererState.saved)
        }
        values.set(itemId, itemDoc)
      }

      items.set(itemId, data)
    }, page) // TODO rewrite to use object instead of multiple paramss

    // The function hasUnsavedData is used to pass the unsaved flag reactively
    // to the parent component and allow the system to check for unfinished items in a task.
    // It is optional and needs therefore to be checked for being typeof function.
    if (typeof hasUnsavedData === 'function') {
      hasUnsavedData(itemId, () => {
        return instance.state.get('unsaved')
      })
    }
  })
})

// clear all items and schemas but only if if there is no itemId or count is
// lower than 2, because otherwise there may be still rendered items that
// would otherwise be emptied

Template.itemRenderer.onDestroyed(function () {
  const instance = this
  const itemId = instance.data.itemId
  const count = instances.get(this.data.itemId) || 0

  if (itemId) {
    if (count > 1) {
      instances.set(this.data.itemId, count - 1)
    }

    else {
      items.set(this.data.itemId, null)
      values.set(this.data.itemId, null)
      states.set(this.data.itemId, null)
      rendererSchemas.delete(itemId)
    }
  }

  else {
    items.clear()
    values.clear()
    states.clear()
    rendererSchemas.clear()
  }
})

Template.itemRenderer.helpers({
  loadComplete () {
    return API.initComplete() && formInitialized.get()
  },
  isPreview () {
    return Template.instance().data.preview
  },
  item (itemId) {
    return items.get(itemId)
  },
  itemSchema (itemId) {
    return rendererSchemas.get(itemId)
  },
  hasGroupMode (mode) {
    return mode && mode !== GroupMode.off.value
  },
  buttonClasses (itemId) {
    const status = states.get(itemId)
    if (status === ItemRendererState.submit) return 'btn btn-secondary btn-disabled'
    return 'btn btn-secondary'
  },
  itemFormName (id) {
    return getFormId(id)
  },
  itemHasValue (itemId) {
    return true
    /*
     const formId = getFormId(itemId)
     const fieldValue = AutoForm.getFieldValue(itemId, formId)
     const schema = rendererSchemas[ itemId ]
     const validateContext = schema.newContext()
     validateContext.validate({[itemId]: fieldValue})
     const errors = validateContext.validationErrors()
     return !errors || errors.length === 0
     */
  },
  buttonContent (itemId) {
    const status = states.get(itemId)
    if (status === ItemRendererState.submit) return 'item.submitting'
    return 'item.save'
  },
  value (itemId) {
    return values.get(itemId)
  },
  toLocaleDate (date) {
    return date && date.toLocaleString()
  },
  submitting (itemId) {
    const status = states.get(itemId)
    return (status === ItemRendererState.submit)
  },
  saved (itemId) {
    const status = states.get(itemId)
    return (status === ItemRendererState.saved)
  },
  itemDisabled (isEditable, itemId, groupMode) {
    if (!isEditable) { return true }

    // in merge mode we don't disable the item since we
    // want to keep it "live" for group work.
    if (groupMode === 'merge') {
      return false
    }

    const status = states.get(itemId)
    return [ItemRendererState.saved, ItemRendererState.submit].includes(status)
  },
  error () {
    return Template.getState('error')
  }
})

Template.itemRenderer.events({
  'click  .itemrenderer-edit-button' (event, templateInstance) {
    event.preventDefault()
    const itemId = templateInstance.$(event.currentTarget).data('target')
    states.set(itemId, ItemRendererState.editing)
  },
  'blur form' (event, templateInstance) {
    templateInstance.state.set('unsaved', true)
  },
  'submit form' (event, templateInstance) {
    event.preventDefault()

    if (templateInstance.data.preview) {
      return // skip submission on preview
    }

    templateInstance.state.set('unsaved', false)
    const formId = event.currentTarget.id
    const itemId = formId.replace('itemForm_', '')

    const { insertDoc } = AutoForm.getFormValues(formId)
    const { updateDoc } = AutoForm.getFormValues(formId)

    // first we validate against the item schema
    const schema = rendererSchemas.get(itemId)
    const validateContext = schema.newContext()
    validateContext.validate(insertDoc)

    // if there are validation errors we attach them
    // and skip further processing / dispatching
    const errors = validateContext.validationErrors()
    if (errors && errors.length > 0) {
      return
    }

    // dispatch to the callbacks
    const { onItemSubmit, groupMode } = templateInstance.data

    if (onItemSubmit) {
      states.set(itemId, ItemRendererState.submit)
      onItemSubmit({ itemId, groupMode, insertDoc, updateDoc }, (err, itemDoc) => {
        if (err) {
          states.set(itemId, ItemRendererState.submissionFailed)
        }
        if (itemDoc) {
          states.set(itemId, ItemRendererState.saved)
          values.set(itemId, itemDoc)
        }
      })
    }
  }
})

function getFormId (itemId) {
  return `itemForm_${itemId}`
}

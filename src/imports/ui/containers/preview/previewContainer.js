import { Template } from 'meteor/templating'
import { callMethod } from '../../controllers/document/callMethod'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { getMaterialRenderer } from '../../../api/material/getMaterialRenderer'
import './previewContainer.html'
import { Item } from '../../../contexts/tasks/definitions/items/Item'

const API = Template.previewContainer.setDependencies({
  contexts: [Task], // TODO add more if more are needed
  useForms: true
})

Template.previewContainer.onCreated(function () {
  const instance = this
  const { type, docId, token } = instance.data.params

  instance.loadDocument = async (document) => {
    await Item.initialize()
    const ctx = ContextRegistry.get(type)
    const { material } = ctx
    const { template, load, data } = getMaterialRenderer(material, 'preview')
    await load()
    const materialDoc = { name: ctx.name }
    const options = { preview: true, print: true }
    const previewData = data({ materialDoc, document, options })
    const loadComplete = true
    instance.state.set({ previewData, document, template, loadComplete })
  }

  callMethod({
    name: `${type}.methods.preview`,
    args: {
      _id: docId,
      token: token
    },
    failure: API.fatal,
    success: instance.loadDocument,
  })
})

Template.previewContainer.helpers({
  loadComplete () {
    return Item.isInitialized() && API.initComplete() && Template.getState('loadComplete')
  },
  document () {
    return Template.getState('document')
  },
  templateName () {
    return Item.isInitialized() && API.initComplete() && Template.getState('template')
  },
  templateData () {
    return Template.getState('previewData')
  }
})

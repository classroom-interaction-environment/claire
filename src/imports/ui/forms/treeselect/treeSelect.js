/* global AutoForm */
import { Template } from 'meteor/templating'
import { dataTarget } from '../../utils/dataTarget'
import { ReactiveSet } from '../../../api/utils/reactive/ReactiveSet'
import './treeSelect.html'

AutoForm.addInputType('treeSelect', {
  template: 'afTreeSelect',
  valueOut () {
    const value = this.val() ?? this.value
    return value.split(',')
  },
  valueIn (initialValue) {
    return initialValue
  }
})

Template.afTreeSelect.onCreated(function () {
  const instance = this
  const { documents = [], renderer, ...inputAtts } = instance.data.atts
  const initialValue = Array.isArray(instance.data.value)
    ? instance.data.value
    : []
  instance.ids = new ReactiveSet()
  initialValue.forEach(v => instance.ids.add(v))
  instance.state.set({ documents, renderer, inputAtts })
})

Template.afTreeSelect.onRendered(function () {
  const instance = this
  const dataSchemaKey = instance.data.atts['data-schema-key']
  instance.autorun(() => {
    const ids = instance.ids.all()
    instance.$(`input[data-schema-key="${dataSchemaKey}"]`).val(ids.join(','))
  })
})

Template.afTreeSelect.helpers({
  ids () {
    return Template.instance().ids
  },
  documents () {
    return Template.getState('documents')
  },
  renderer () {
    return Template.getState('renderer')
  },
  nodeData (doc) {
    return {
      renderer: Template.getState('renderer'),
      doc
    }
  },
  inputAtts () {
    return {
      type: 'hidden',
      ...Template.getState('inputAtts')
    }
  }
})

Template.afTreeSelectNode.helpers({
  isAdded (id) {
    return Template.instance().data.ids.has(id)
  },
})

Template.afTreeSelectNode.events({
  'click .af-treeselect-button' (event) {
    event.preventDefault()
    const type = dataTarget(event, 'action')
    const docId = dataTarget(event, 'id')
    const ids = Template.instance().data.ids
    if (type === 'add') {
      ids.add(docId)
    } else {
      ids.delete(docId)
    }
  }
})
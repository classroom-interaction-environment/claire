import { Template } from 'meteor/templating'
import { resolveMaterialReference } from '../../../../contexts/material/resolveMaterialReference'
import '../../../generic/tooltip/tooltip'
import './nonPhaseMaterial.html'

const byCollection = (a, b) => {
  return a.collection.localeCompare(b.collection)
}

Template.nonPhaseMaterial.onCreated(function () {
  const instance = this
  instance.state.set('inline', !!instance.data.inline)

  instance.autorun(() => {
    const data = Template.currentData()
    const inlineToggle = data.inlineToggle
    const inline = data.inline

    // update inline value only reactively
    // if we have not activated the toggle
    if (!inlineToggle) {
      instance.state.set('inline', !!inline)
    }
  })
})

Template.nonPhaseMaterial.helpers({
  references (refList = []) {
    return refList && refList
      .sort(byCollection)
      .map(refObj => resolveMaterialReference(refObj))
  },
  inlineActive () {
    return Template.getState('inline')
  }
})

Template.nonPhaseMaterial.events({
  'click .nonPhaseMaterial-toggle-button' (event, templateInstance) {
    event.preventDefault()
    const inline = templateInstance.state.get('inline')
    templateInstance.state.set('inline', !inline)
  }
})

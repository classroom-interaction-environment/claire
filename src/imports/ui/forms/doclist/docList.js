import { Template } from 'meteor/templating'
import './docList.html'

AutoForm.addInputType('docList', {
  template: 'afDocList',
  valueOut () {
    return this.val()
  }
})

Template.afDocList.helpers({
  docs () {
    return Template.currentData().value
  },
  renderer (doc) {
    const templateData = Template.instance().data
    const renderer = templateData?.atts?.renderer
    if (!renderer) { return }

    const data = typeof renderer.data === 'function'
      ? renderer.data(doc)
      : doc
    return {
      template: renderer.template,
      data
    }
  }
})

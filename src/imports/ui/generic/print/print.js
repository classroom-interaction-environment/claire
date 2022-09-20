import { Template } from 'meteor/templating'
import './print.html'

Template.print.helpers({
  getLabel (label) {
    return Template.instance().data.label === false
      ? ''
      : label
  }
})

Template.print.events({
  'click .global-print-button' (event) {
      event.preventDefault()
      event.stopPropagation()
      window.print()
  }
})

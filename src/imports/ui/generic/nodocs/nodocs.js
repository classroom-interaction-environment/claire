import { Template } from 'meteor/templating'
import './nodocs.html'

export const nodocsClassName = 'no-entries-warning'

Template.nodocs.onCreated(function () {})

Template.nodocs.helpers({
  className () {
    return nodocsClassName
  }
})

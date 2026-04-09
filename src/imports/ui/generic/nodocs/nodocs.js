import { Template } from 'meteor/templating'
import './nodocs.html'

export const nodocsClassName = 'no-entries-warning'

Template.nodocs.onCreated(() => {})

Template.nodocs.helpers({
  className () {
    return nodocsClassName
  }
})

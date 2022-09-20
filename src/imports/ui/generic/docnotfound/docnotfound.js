import { Template } from 'meteor/templating'
import './docnotfound.html'

export const docnotfoundClassName = 'document-not-found'

Template.docnotfound.onCreated(function () {})

Template.docnotfound.helpers({
  className () {
    return docnotfoundClassName
  }
})

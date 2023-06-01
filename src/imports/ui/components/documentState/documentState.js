import { Template } from 'meteor/templating'
import './documentState.html'

Template.documentState.helpers({
  hideLabel () {
    const { showLabel } = Template.instance().data
    return showLabel === false
  },
  isOriginal (_original, originalRef) {
    return _original || originalRef
  }
})

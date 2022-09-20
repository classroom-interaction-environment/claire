import { Template } from 'meteor/templating'
import './enum.html'

Template.textRendererenum.helpers({
  correctIndex (index) {
    return index + 1
  }
})

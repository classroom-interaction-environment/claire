import { Template } from 'meteor/templating'
import './share.html'

Template.share.onCreated(function () {})

Template.share.helpers({
  getLink () {
    return window.location
  }
})

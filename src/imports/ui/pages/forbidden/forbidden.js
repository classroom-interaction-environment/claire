import { Template } from 'meteor/templating'
import './forbidden.html'

Template.forbidden.onCreated(() => {})

Template.forbidden.helpers({})

Template.forbidden.events({
  'click .back-button' (event) {
    event.preventDefault()
    window.history.back()
  }
})

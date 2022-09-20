import { Template } from 'meteor/templating'
import './short.scss'
import './short.html'

Template.short.helpers({
  open () {
    return Template.getState('open')
  }
})

Template.short.events({
  'click .collapsed' (event, templateInstance) {
    event.preventDefault()
    const open = !templateInstance.state.get('open')
    templateInstance.state.set({ open })
  }
})

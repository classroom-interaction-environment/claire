import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import '../icon/icon'
import './disconnected.html'

const API = Template.disconnected.setDependencies()

Template.disconnected.onRendered(function () {
  const instance = this
  instance.autorun(() => {
    const status = Meteor.status()
    if (!status.connected) {
      API.log('[Connection]: disconnected, check in 1000ms if still disconnected')
      setTimeout(() => {
        if (Meteor.status().connected === false) {
          API.log('[Connection]: still disconnected')
          instance.$('#global-disconnected-modal').modal('show')
        }
      }, 1000)
    }
    else {
      API.log('[Connection]: connected')
      setTimeout(() => {
        instance.$('#global-disconnected-modal').modal('hide')
      }, 1000)
    }
  })
})

Template.disconnected.helpers({
  connectionStatus () {
    const status = Meteor.status().status
    return `connection.${status}`
  },
  connected () {
    return Meteor.status().connected
  }
})

Template.disconnected.events({
  'click .reload-page-button' (event) {
    event.preventDefault()
    window.location.reload({ forcedReload: true })
  }
})

import { Template } from 'meteor/templating'
import './icon.html'

Template.icon.onCreated(function () {
  const instance = this
  const { data } = instance

  const fw = data.fw ? 'fa-fw' : ''
  const type = data.type || 'fas'
  const spin = data.spin ? 'fa-spin' : ''
  const pulse = data.pulse ? 'fa-pulse' : ''
  const customClasses = data.class || ''
  const name = data.name

  // build attributes
  const attributes = {}
  attributes.class = `fa ${fw} ${type} ${spin} ${pulse} fa-${name} ${customClasses}`

  instance.state.set({ attributes })
})

Template.icon.helpers({
  attributes () {
    return Template.getState('attributes')
  }
})

Template.icon.events({
  'mouseout|mouseover span,i' (event) {
    event.stopPropagation()
  }
})

import { Template } from 'meteor/templating'
import { toolTipEvents } from '../../generic/utils/tooltipUtils'
import { contrastColor } from '../../utils/color/contrastColor'
import './dimension.html'

Template.dimension.onCreated(function () {
  const { data } = this
  const attributes = new Map()

  if (data.title) {
    attributes.set('title', data.title)
    attributes.set('data-trigger', 'manual')
  }

  if (data.disabled) {
    attributes.set('disabled', data.disabled)
  }

  if (data.color) {
    attributes.set('style', `color: ${contrastColor(data.color)};background-color: ${data.color};`)
  }

  Object.keys(data).forEach(key => {
    if (key.indexOf('data-') > -1) {
      attributes.set(key, data[key])
    }
  })

  this.state.set({
    attributes: Object.fromEntries(attributes.entries())
  })
})

Template.dimension.helpers({
  attributes () {
    return Template.getState('attributes')
  }
})

Template.dimension.events(toolTipEvents({ name: '.dimension-badge' }))

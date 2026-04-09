import { Template } from 'meteor/templating'
import { toolTipEvents } from '../utils/tooltipUtils'
import '../icon/icon'
import './tooltip.html'

Template.tooltip.onCreated(function () {
  const { data } = this

  const labelOrIcon = Boolean(data.label || data.icon)
  const customClass = data.class || ''
  const placement = data.placement || 'top'
  const attributes = {
    'data-toggle': 'tooltip',
    'data-trigger': 'manual',
    'data-placement': placement
  }
  attributes.title = data.title
  attributes.class = `caro-tooltip tooltip-target ${customClass}`

  this.state.set({ labelOrIcon, attributes })
})

Template.tooltip.helpers({
  labelOrIcon () {
    return Template.getState('labelOrIcon')
  },
  attributes () {
    return Template.getState('attributes')
  }
})

Template.tooltip.events(toolTipEvents({ name: '.caro-tooltip' }))

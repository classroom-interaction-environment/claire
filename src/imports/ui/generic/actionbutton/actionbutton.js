import { Template } from 'meteor/templating'
import { toolTipEvents } from '../utils/tooltipUtils'
import '../icon/icon'
import './actionbutton.html'

Template.actionButton.onCreated(function () {})

Template.actionButton.helpers({
  dataAtts () {
    const instance = Template.instance()
    const { data } = instance
    const dataAtts = {}
    Object.keys(data).forEach(key => {
      if (key.indexOf('data-') > -1) {
        dataAtts[key] = data[key]
      }
    })
    return dataAtts
  },
  useToolip () {
    const data = Template.instance().data
    return data.title && data.tooltip !== false
  }
})

Template.actionButton.events(toolTipEvents({ name: '.action-btn' }))

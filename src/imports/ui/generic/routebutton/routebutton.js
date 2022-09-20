import { Template } from 'meteor/templating'
import { toolTipEvents } from '../utils/tooltipUtils'
import '../icon/icon'
import './routebutton.html'

Template.routeButton.onCreated(function () {})

Template.routeButton.helpers({
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
  useTooltip () {
    const data = Template.instance().data
    return data.title && data.tooltip !== false
  }
})

Template.routeButton.events(toolTipEvents({ name: '.caro-route-button' }))

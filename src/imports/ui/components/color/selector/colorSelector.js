import { Template } from 'meteor/templating'
import './colorSelector.html'

Template.colorSelector.helpers({
  content () {
    const { data } = Template.instance()
    return data && data.colors
  }
})

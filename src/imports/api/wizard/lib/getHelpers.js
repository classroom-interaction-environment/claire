import { Template } from 'meteor/templating'

export const getHelpers = () => ({
  stateVisible (stateName) {
    return Template.instance().wizard.stateVisible(stateName)
  },
  disabled (stateName, componentName) {
    return Template.instance().wizard.isDisabled(stateName, componentName)
  },
  wasSelected (stateName, componentName) {
    return Template.instance().wizard.wasSelected(stateName, componentName)
  },
  stepComplete (stateName) {
    return Template.instance().wizard.stepComplete(stateName)
  }
})

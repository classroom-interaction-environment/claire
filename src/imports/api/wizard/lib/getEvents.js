export const getEvents = () => ({
  'click .wizard-skip-button' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const nextState = $target.data('nextstate')
    const component = $target.data('component')
    templateInstance.wizard.pushView(nextState, component)
  },
  'click .wizard-back-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.wizard.popView()
  }
})

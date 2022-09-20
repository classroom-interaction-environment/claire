import { check, Match } from 'meteor/check'
import Driver from 'driver.js'
import 'driver.js/dist/driver.min.css';
import { i18n } from '../../../api/language/language'

export const Guide = {}

const createDriver = ({ allowClose, opacity }) => new Driver({
  allowClose,
  opacity,
  doneBtnText: i18n.get('wizard.finish'),
  closeBtnText: i18n.get('actions.close'),
  nextBtnText: i18n.get('wizard.next'),
  prevBtnText: i18n.get('wizard.back'),
  animate: true,
})

const createStep = ({ target, title, description, position = 'top', showButtons }) => {
  check(target, String)
  check(title, Match.Maybe(String))
  check(description, Match.Maybe(String))
  check(position, Match.Maybe(String))
  check(showButtons, Match.Maybe(Boolean))
  const step = {
    element: target
  }

  if (title) {
    step.popover = step.popover || {}
    step.popover.title = title
  }

  if (description) {
    step.popover = step.popover || {}
    step.popover.description = description
  }

  if (position) {
    step.popover = step.popover || {}
    step.popover.position = position
  }

  if (showButtons) {
    step.popover = step.popover || {}
    step.showButtons = showButtons
  }

  return step
}

Guide.highlight = function highlight ({ target, title, description, position, showButtons, allowClose = true, opacity = 0.75 }) {
  const driver = createDriver({ allowClose, opacity })
  const step = createStep({ target, title, description, position, showButtons})
  driver.highlight(step)
  return driver
}

Guide.buildTour = function  buildTour ({ allowClose = true, opacity = 0.75 }) {
  const driver = createDriver({ allowClose, opacity })
  const steps = []
  const builder = {
    addStep ({ target, title, description, position, showButtons }) {
      const step = createStep({ target, title, description, position, showButtons })
      steps.push(step)
      return builder
    },
    complete () {
      driver.defineSteps(steps)
      return driver
    }
  }

  return builder
}

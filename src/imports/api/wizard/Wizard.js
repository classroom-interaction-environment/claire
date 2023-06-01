import { check, Match } from 'meteor/check'
import { ReactiveVar } from 'meteor/reactive-var'
import { getEvents } from './lib/getEvents'
import { create } from './lib/create'
import { getHelpers } from './lib/getHelpers'
import { config } from './lib/config'

async function importTemplates () {
  await import('./templates/wizardSpacer.html')
  await import('./templates/wizardArrow.html')
  await import('./templates/wizardBack.html')
  await import('./templates/wizardSkip.html')
  await import('./templates/wizardStep.html')
  await import('./templates/wizardComponents.html')
  return true
}

export const Wizard = {
  init ({ i18n, prefix, onError } = {}) {
    check(i18n, Match.Maybe(Function))
    check(prefix, Match.Maybe(String))

    const initComplete = new ReactiveVar()
    initComplete.set(false)

    if (i18n) {
      config.i18n = i18n
    }

    if (prefix) {
      config.prefix = prefix
    }

    importTemplates()
      .then(() => {
        config.initialized = true
        initComplete.set(true)
      })
      .catch(e => {
        initComplete.set(e)
        if (onError) onError(e)
      })

    return initComplete
  },
  getHelpers: getHelpers,
  getEvents: getEvents,
  create: create
}

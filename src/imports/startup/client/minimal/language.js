import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from "meteor/tracker"
import { i18n } from '../../../api/language/language'
import { Router } from '../../../api/routes/Router'

// global helper that we will need early and often
// triggers i18n reactivity on template-level
// which allows us to write three dots until the template-level
// language has been initialized / loaded
Template.registerHelper('i18n', function (...args) {
  const instance = Template.instance()
  const templateName = instance.view.name.split('.')[1]
  const template = Template[templateName]

  if (template && template.initComplete && !template.initComplete.get()) {
    return '...'
  }

  return i18n.get(...args)
})

Template.registerHelper('i18nInitialized', function () {
  return i18n.initialized()
})

const { siteName } = Meteor.settings.public

// we need to reactively change document.title and html-lang
// based on the current route's label and the locale
Tracker.autorun(() => {
  const label = Router.label()
  const initialized = i18n.initialized()

  if (!label || !initialized) { return }

  const locale = i18n.getLocale()
  const isUntranslated = label.includes('.')
  const translated = isUntranslated
    ? i18n.get(locale, label)
    : label

  if (translated === label && isUntranslated) {
    document.title = siteName
  }

  else {
    document.title = `${translated} - ${siteName}`
  }
})


Meteor.startup(() => {
  document.documentElement.setAttribute('lang', window.navigator.language)
})

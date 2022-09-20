import { Template } from 'meteor/templating'
import { Meteor } from 'meteor/meteor'
import { i18n } from '../../../api/language/language'
import { Language } from '../../../contexts/system/Language'
import { changeLocale } from '../../../api/language/changeLocale'
import './langselect.html'

const toSettings = lang => lang.settings
const API = Template.langselect.setDependencies({
  contexts: [Language]
})

Template.langselect.onCreated(function () {
  const instance = this
  loadAvailable(instance).catch(API.notify)
})

const loadAvailable = async (instance) => {
  const availableLanguages = await import('../../../api/language/config/availableLanguages')
  const available = availableLanguages.default || availableLanguages
  instance.state.set({
    availableLanguages: Object.values(available).map(toSettings)
  })
}

Template.langselect.helpers({
  getFlagname (lang) {
    const currentLang = lang || i18n.getLocale()
    const languages = Template.getState('availableLanguages')
    if (!languages) return currentLang

    const locale = languages.find(l => l.code === currentLang)
    return (locale && locale.icon) || currentLang
  },
  availableLanguages () {
    return Template.getState('availableLanguages')
  }
})

Template.langselect.events({
  'click .select-lang' (event, templateInstance) {
    event.preventDefault()

    const target = templateInstance.$(event.currentTarget)
    const lang = target.data('lang')
    global.$('html').prop('lang', lang)

    // set profile only on logged in users
    if (!Meteor.userId()) {
      return changeLocale(lang)
    }

    Meteor.call(Language.methods.updateProfile.name, { lang }, (err, res) => {
      if (err) {
        API.notify(err)
      }

      // if for whatever reason we have no update success without error
      // we raise a warning but still try to change the UI langauge
      if (res !== lang) {
        API.notify({
          type: 'warn',
          text: 'langselect.notUpdated'
        })
      }

      // even with any error we still attempt to change the ui lang
      return changeLocale(lang)
    })
  }
})

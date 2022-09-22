import { Template } from 'meteor/templating'
import { Meteor } from 'meteor/meteor'
import { Users } from '../../../contexts/system/accounts/users/User'
import { i18n } from '../../../api/language/language'
import { changeLocale } from '../../../api/language/changeLocale'
import { callMethod } from '../../controllers/document/callMethod'
import './langselect.html'

const toSettings = lang => lang.settings
const API = Template.langselect.setDependencies({
  contexts: [Users]
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

    const userId = Meteor.userId()

    // Update profile only on logged-in users
    if (!userId) {
      return changeLocale(lang)
    }

    callMethod({
      name: Users.methods.updateProfile,
      args: { locale: lang },
      failure: API.notify,
      receive: () => changeLocale(lang),
      success: () => API.notify(true)
    })
  }
})

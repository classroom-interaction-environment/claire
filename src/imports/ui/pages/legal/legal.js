import { Template } from 'meteor/templating'
import { Settings } from '../../../contexts/system/settings/Settings'
import './legal.html'

const allLegal = Settings.legal

Template.legal.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    const { type } = Template.currentData().params
    const settingsDoc = Settings.helpers.get()
    const otherLegal = Object.keys(allLegal).filter(key => key !== type)

    instance.state.set({
      value: settingsDoc && settingsDoc[type],
      label: type,
      others: otherLegal
    })
  })
})

Template.legal.helpers({
  currentLegal () {
    return Template.getState('value')
  },
  currentType () {
    return Template.getState('label')
  },
  getLastRoute () {
    const { lastRoute } = Template.instance().data
    const pathname = window.location.pathname

    if (!lastRoute.pathname || lastRoute.pathname === pathname) {
      return '/'
    }

    return lastRoute.pathname + lastRoute.search
  },
  otherLegal () {
    return Template.getState('others')
  }
})

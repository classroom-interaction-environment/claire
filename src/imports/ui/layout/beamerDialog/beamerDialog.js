import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { Router } from '../../../api/routes/Router'
import { Routes } from '../../../api/routes/Routes'
import './beamerDialog.html'

const API = Template.beamerDialog.setDependencies()

Template.beamerDialog.onCreated(function () {
  const instance = this
  instance.state.set('presentLoaded', false)
})

Template.beamerDialog.helpers({
  beamerDoc () {
    return Beamer.doc.get()
  },
  beamerBackground () {
    const background = Beamer.doc.background()
    return background && `h-100 bg-${background.className} text-${background.text}`
  },
  presentLoaded () {

  },
  initVisible () {
    return Template.getState('initVisible')
  },
  controlVisible () {
    return Template.getState('presentLoaded') && Template.getState('controlVisible')
  }
})

Template.beamerDialog.events({
  'show.bs.modal #beamerInitDialog' (event, templateInstance) {
    templateInstance.state.set('initVisible', true)
  },
  'hidden.bs.modal #beamerInitDialog' (event, templateInstance) {
    templateInstance.state.set('initVisible', false)
  },
  'show.bs.modal #beamerControlDialog' (event, templateInstance) {
    if (!templateInstance.state.get('presentLoaded')) {
      import('../../pages/present/present')
        .catch(API.notify)
        .then(() => templateInstance.state.set('presentLoaded', true))
    }
    templateInstance.state.set('controlVisible', true)
  },
  'hidden.bs.modal #beamerControlDialog' (event, templateInstance) {
    templateInstance.state.set('controlVisible', false)
  },
  'click .open-beamer-local-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#beamerInitDialog').modal('hide')
    setTimeout(() => Router.go(Routes.present.path()), 500)
  },
  'click .open-beamer-external-button' (event, templateInstance) {
    event.preventDefault()
    if (!templateInstance.state.get('presentLoaded')) {
      import('../../pages/present/present').then(() => templateInstance.state.set('presentLoaded', true))
    }
    templateInstance.$('#beamerInitDialog').modal('hide')
    const location = Routes.present.path()
    setTimeout(() => Beamer.actions.init(location), 500)
  },
  'click .end-beamer-button' (event, templateInstance) {
    event.preventDefault()
    Beamer.actions.unload((err) => {
      if (err) {
        API.notify(err)
      }
      else {
        API.notify(true)
        templateInstance.$('#beamerControlDialog').modal('hide')
      }
    })
  }
})

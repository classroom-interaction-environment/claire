import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { Routes } from '../../../api/routes/Routes'
import './beamer.html'

Template.beamer.helpers({
  beamerIsActive () {
    return Beamer.status()
  }
})

Template.beamer.events({
  'click .global-beamer-button' (event, templateInstance) {
    event.preventDefault()
    if (Beamer.status()) {
      templateInstance.$('#beamerControlDialog').modal('show')
    }
    else {
      const lessonId = templateInstance.data.lessonId
      const location = Routes.present.path({ lessonId })
      setTimeout(() => Beamer.actions.init(location), 500)
    }
  }
})
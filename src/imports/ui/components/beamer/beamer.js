import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { Routes } from '../../../api/routes/Routes'
import './beamer.html'
import { asyncTimeout } from '../../../api/utils/asyncTimeout'

Template.beamer.helpers({
  beamerIsActive () {
    return Beamer.status()
  }
})

Template.beamer.events({
  'click .global-beamer-button': async (event, templateInstance) => {
    event.preventDefault()
    if (Beamer.status()) {
      templateInstance.$('#beamerControlDialog').modal('show')
    }
    else {
      const lessonId = templateInstance.data.lessonId
      const location = Routes.present.path({ lessonId })
      await asyncTimeout(500)
      await Beamer.actions.init(location)
    }
  }
})
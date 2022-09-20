import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { Routes } from '../../../api/routes/Routes'
import '../../layout/navSide/navSide'
import '../../layout/main/main'
import '../../layout/routeInfo/routeInfo'
import '../../layout/footer/footer'
import './teacherContainer.scss'
import './teacherContainer.html'

Template.teacherContainer.events({
  'click .global-beamer-button' (event, templateInstance) {
    event.preventDefault()
    if (Beamer.status()) {
      templateInstance.$('#beamerControlDialog').modal('show')
    } else {
      const location = Routes.present.path()
      setTimeout(() => Beamer.actions.init(location), 500)
    }
  }
})

export const teacherContainer = 'teacherContainer'

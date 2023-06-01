import { Template } from 'meteor/templating'
import { Router } from '../../../../api/routes/Router'
import { BackRoute } from '../../../controllers/student/BackRoute'
import { dataTarget } from '../../../utils/dataTarget'
import '../../../generic/share/share'
import '../../../components/langselect/langselect'
import '../../../components/fluidswitch/fluidSwitch'
import '../../../components/profileImage/profileImage'
import '../../../components/student/join/joinClass'
import studentNavLanguage from './i18n/studentNavLanguage'
import './navStudent.scss'
import './navStudent.html'

const API = Template.nav.setDependencies({
  language: studentNavLanguage
})

Template.nav.helpers({
  loadComplete () {
    return API.initComplete()
  },
  active (...params) {
    params.pop()
    return params.some(name => Router.isActive(name))
  },
  backRoute () {
    return BackRoute.get()
  }
})

Template.nav.events({
  // commented out until fully clear how to implement
  // 'click #globalShareButton' (event) {
  //  global.$('#shareModal').modal('show')
  // },
  'click .main-navbar-link' (event, templateInstance) {
    const activeCategory = dataTarget(event, templateInstance, 'link')
    templateInstance.state.set('active', activeCategory)
  },
  'click .navbar-navlink' (event, templateInstance) {
    const $target = templateInstance.$('#collapsibleNavbar')
    $target.collapse('hide')
  },
  'click .enter-invitation-code-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#global-code-modal').modal('show')
  }
})

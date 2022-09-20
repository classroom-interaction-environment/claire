import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import { SubsManager } from '../../subscriptions/SubsManager'
import { dataTarget } from '../../utils/dataTarget'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import '../../generic/print/print'
import '../../generic/share/share'
import '../../components/langselect/langselect'
import '../../components/fluidswitch/fluidSwitch'
import '../../components/profileImage/profileImage'
import '../../components/beamer/beamer'
import navLanguage from './i18n/navLanguage'
import './nav.css'
import './nav.html'

Template.nav.setDependencies({
  language: navLanguage
})

Template.nav.helpers({
  active (...params) {
    params.pop()
    return params.some(name => Router.isActive(name))
  },
  userEmail (currentUser) {
    return currentUser && currentUser.emails && currentUser.emails[0] && currentUser.emails[0].address
  },
  unitContext () {
    return Unit
  },
  taskContext () {
    return Task
  }
})

Template.nav.events({
  'click #globalShareButton' (event) {
    global.$('#shareModal').modal('show')
  },
  'click .main-navbar-link' (event, templateInstance) {
    const activeCategory = dataTarget(event, templateInstance, 'link')
    templateInstance.state.set('active', activeCategory)
  },
  'click .nav-logout-button' (event, templateInstance) {
    event.preventDefault()
    SubsManager.dispose()
    setTimeout(() => Meteor.logout(), 500)
  }
})

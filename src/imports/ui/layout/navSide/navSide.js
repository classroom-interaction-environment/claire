import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import { SubsManager } from '../../subscriptions/SubsManager'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { dataTarget } from '../../utils/dataTarget'
import { getParam } from '../../../api/routes/params/getParam'
import navLanguage from './i18n/navLanguage'
import '../../generic/print/print'
import '../../generic/share/share'
import '../../components/langselect/langselect'
import '../../components/fluidswitch/fluidSwitch'
import '../../components/profileImage/profileImage'
import '../../components/beamer/beamer'
import './navSide.html'
import './navSide.scss'

const API = Template.navSide.setDependencies({
  language: navLanguage
})

Template.navSide.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const lessonId = getParam('lessonId')
    instance.state.set({ lessonId })
  })
})

Template.navSide.helpers({
  loadComplete () {
    return API.initComplete()
  },
  active (...params) {
    params.pop()
    return params.some(name => Router.isActive(name))
  },
  userEmail (currentUser) {
    return currentUser?.emails?.[0]?.address
  },
  unitContext () {
    return Unit
  },
  taskContext () {
    return Task
  },
  lessonId () {
    return Template.getState('lessonId')
  }
})

Template.navSide.events({
  // commented out until fully clear how to implement
  // 'click #globalShareButton' (event) {
  //  global.$('#shareModal').modal('show')
  // },
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

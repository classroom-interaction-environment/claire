import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { SubsManager } from '../../subscriptions/SubsManager'
import { Notify } from '../../components/notifications/Notify'
import '../../generic/fail/fail'
import './logout.html'

Template.logout.setDependencies({})

Template.logout.onCreated(function onLogoutCreated () {
  const instance = this
  const allSubs = Object.keys(SubsManager.all())

  const logout = () => Meteor.logout((err) => {
    if (err) {
      instance.state.set('err', err)
    } else {
      Notify.success('logout.success')
      instance.state.set('complete', true)
      instance.data.onSuccess()
    }
  })

  SubsManager.dispose()

  if (allSubs.length > 0) {
    setTimeout(logout, 1000)
  } else {
    logout()
  }
})

Template.logout.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  complete () {
    return Template.getState('complete')
  },
  hasError () {
    return Template.getState('error')
  }
})

import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Accounts } from 'meteor/accounts-base'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { i18n } from '../../../../api/language/language'
import dely from 'dely'
import './verifyEmail.html'

const by1000 = dely(1000)

Template.verifyEmail.onCreated(function () {
  const instance = this
  instance.state = new ReactiveDict()

  const { verificationToken } = instance.data.params
  Accounts.verifyEmail(verificationToken, by1000((err) => {
    if (err) {
      if (err.reason.indexOf('Verify email link expired') > -1) {
        err.reason = i18n.get('user.verifyEmail.expired')
      } else {
        console.error(err)
      }
    }
    instance.state.set({ error: err, loadComplete: true })
  }))
})

Template.verifyEmail.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  },
  error () {
    return Template.instance().state.get('error')
  },
  resendInvitation () {
    return Template.instance().state.get('resendInvitation')
  },
  invitationResent () {
    return Template.instance().state.get('invitationResent')
  }
})

Template.verifyEmail.events({
  'click .resend-button' (event, templateInstance) {
    event.preventDefault()
    const userId = Meteor.userId() || templateInstance.data.queryParams.u
    templateInstance.state.set('resendInvitation', true)
    Meteor.call(Users.methods.resendVerificationMail.name, { userId }, (err) => {
      if (err) {
        console.error(err)
        templateInstance.state.set({ error: err })
      }
      templateInstance.state.set({ resendInvitation: false, invitationResent: true })
    })
  },
  'click .complete-button' (event, templateInstance) {
    event.preventDefault()
    if (templateInstance.data.onComplete) {
      templateInstance.data.onComplete()
    }
  }
})

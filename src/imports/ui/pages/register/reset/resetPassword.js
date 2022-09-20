import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { Template } from 'meteor/templating'
import { Accounts } from 'meteor/accounts-base'
import { PasswordConfig } from '../../../../api/accounts/registration/PasswordConfig'
import { i18n } from '../../../../api/language/language'
import { Schema } from '../../../../api/schema/Schema'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { confirmSchema, password2Schema } from '../../../../api/accounts/registration/registerUserSchema'
import { tokenizeEmail } from '../../../../api/utils/email/splitEmail'
import { formIsValid } from '../../../components/forms/formUtils'
import '../../../generic/fail/fail'
import loginLanguage from '../../login/i18n/loginLanguage'
import './resetPassword.html'

let resetPasswordSchema

const API = Template.resetPassword.setDependencies({
  language: loginLanguage
})

Template.resetPassword.onCreated(function () {
  const instance = this
  const { data } = instance
  const token = data.params.token
  const queryDataBase64 = decodeURIComponent(data.queryParams.d)
  const queryDataDecoded = window.atob(queryDataBase64)
  const queryDataJson = JSON.parse(queryDataDecoded)

  const email = queryDataJson && queryDataJson[0]
  if (!email) return API.notify('login.resetPassword.emailExpected')

  const setupForm = () => {
    const emailSplit = tokenizeEmail(email)
    const emailPrefix = emailSplit.prefix
    const emailDomain = emailSplit.domain
    const firstName = queryDataJson[1]
    const lastName = queryDataJson[2]

    const passwordConfig = PasswordConfig.from(Meteor.settings.public.password)
    passwordConfig.blacklist({
      list: [firstName, lastName, emailPrefix, emailDomain],
      message: (value) => i18n.get('login.password.noPreviousCredentials', { password: value })
    })

    resetPasswordSchema = Schema.create({
      email: {
        type: String,
        label: false,
        autoform: {
          class: 'd-none',
          autocomplete: 'email'
        }
      },
      password: password2Schema({
        label: () => i18n.get('login.newPassword'),
        min: passwordConfig.min(),
        max: passwordConfig.max(),
        rules: passwordConfig.rules(),
        userIcon: passwordConfig.icon(),
        autocomplete: 'new-password',
        autofocus: true
      }),
      confirm: confirmSchema({
        min: passwordConfig.min(),
        max: passwordConfig.max(),
        userIcon: passwordConfig.icon(),
        autocomplete: 'confirm-new-password',
        formName: 'resetPasswordForm'
      })
    }, { tracker: Tracker })
  }

  const reason = 'reset'
  Meteor.call(Users.methods.checkResetpasswordToken.name, { email, token, reason }, (err) => {
    if (err) {
      if (err.reason === 'Token expired') {
        err.reason = i18n.get('login.resetPassword.expired')
      }
      instance.state.set('error', err)
    } else {
      setupForm()
    }
    // always
    instance.state.set({
      loadComplete: true,
      doc: { email }
    })
  })
})

Template.resetPassword.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  },
  resetPasswordSchema () {
    return resetPasswordSchema
  },
  doc () {
    return Template.instance().state.get('doc')
  },
  resetting () {
    return Template.instance().state.get('resetting')
  },
  resetComplete () {
    return Template.instance().state.get('resetComplete')
  },
  error () {
    return Template.instance().state.get('error')
  },
  resending () {
    return Template.instance().state.get('resend')
  },
  resent () {
    return Template.instance().state.get('resent')
  }
})

Template.resetPassword.events({
  'submit #resetPasswordForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(resetPasswordSchema, 'resetPasswordForm')
    if (!insertDoc) return

    templateInstance.state.set('resetting', true)
    const token = templateInstance.data.params.token
    const password = insertDoc.password
    Accounts.resetPassword(token, password, (err) => {
      if (err) {
        if (err.reason === 'Token expired') {
          err.reason = i18n.get('login.resetPassword.expired')
        }
        templateInstance.state.set('error', err)
      }
      templateInstance.state.set({ resetting: false, resetComplete: true })
    })
  },
  'click .resend-button' (event, templateInstance) {
    event.preventDefault()
    const doc = templateInstance.state.get('doc')
    const email = doc && doc.email
    if (!email) return API.notify('login.resetPassword.emailExpected')

    templateInstance.state.set('resend', true)
    Meteor.call(Users.methods.sendResetPasswordEmail.name, { email }, (err) => {
      templateInstance.state.set({ resend: false, resent: true })
      if (err) {
        API.notify(err)
      }
    })
  },
  'click .complete-button' (event, templateInstance) {
    event.preventDefault()
    if (templateInstance.data.onComplete) {
      templateInstance.data.onComplete()
    }
  }
})

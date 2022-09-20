import { Tracker } from "meteor/tracker"
import { Template } from "meteor/templating"
import { Settings } from '../../../../contexts/system/settings/Settings'
import { Meteor } from "meteor/meteor"
import { Accounts } from 'meteor/accounts-base'
import { Schema } from '../../../../api/schema/Schema'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { i18n } from '../../../../api/language/language'
import { PasswordConfig } from '../../../../api/accounts/registration/PasswordConfig'
import { confirmSchema, password2Schema } from '../../../../api/accounts/registration/registerUserSchema'
import { tokenizeEmail } from '../../../../api/utils/email/splitEmail'
import { dataTarget } from '../../../utils/dataTarget'
import { formIsValid } from '../../../components/forms/formUtils'
import loginLanguage from '../../login/i18n/loginLanguage'
import '../../../generic/fail/fail'
import './enrollAccount.scss'
import './enrollAccount.html'

const API = Template.enrollAccount.setDependencies({
  contexts: [Settings],
  language: loginLanguage
})

let enrollmentSchema

Template.enrollAccount.onCreated(function () {
  const instance = this
  const { data } = instance
  const token = data.params.verificationToken
  const reason = 'enroll'
  const queryDataBase64 = decodeURIComponent(data.queryParams.d)
  const queryDataDecoded = window.atob(queryDataBase64)
  const queryDataJson = JSON.parse(queryDataDecoded)

  const email = queryDataJson && queryDataJson[0]
  if (!email) return API.notify(new Error('login.resetPassword.emailExpected'))

  instance.state.set({ email })

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

    enrollmentSchema = Schema.create({
      email: {
        type: String,
        label: false,
        autoform: {
          hidden: true,
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
      }),

      privacy: {
        type: Boolean,
        label: () => i18n.get('legal.privacy'),
        custom () {
          if (this.value !== true) {
            return Schema.provider.ErrorTypes.REQUIRED
          }
        },
        autoform: {
          type: 'boolean-checkbox'
        }
      },
      terms: {
        type: Boolean,
        label: () => i18n.get('legal.terms'),
        custom () {
          if (this.value !== true) {
            return Schema.provider.ErrorTypes.REQUIRED
          }
        },
        autoform: {
          type: 'boolean-checkbox'
        }
      }
    }, { tracker: Tracker })
  }

  Meteor.call(Users.methods.checkResetpasswordToken.name, { email, token, reason }, (err) => {
    if (err) {
      instance.state.set('error', err)
    }

    else {
      setupForm()
    }

    // always
    instance.state.set({
      loadComplete: true,
      doc: { email }
    })
  })
})

Template.enrollAccount.helpers({
  loadComplete () {
    return Template.instance().state.get('loadComplete')
  },
  resetPasswordSchema () {
    return enrollmentSchema
  },
  email () {
    return Template.instance().state.get('email')
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

Template.enrollAccount.events({
  'submit #enrollmentForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(enrollmentSchema, 'enrollmentForm')
    if (!insertDoc) return

    const { verificationToken } = templateInstance.data.params
    const { password } = insertDoc

    Accounts.resetPassword(verificationToken, password, (err) => {
      if (err) {
        if (err.reason === 'Token expired') {
          err.reason = i18n.get('login.resetPassword.expired')
        }
        templateInstance.state.set('error', err)
      }

      templateInstance.state.set({ resetting: false, resetComplete: true })

      Tracker.autorun(c => {
        const userId = Meteor.userId()
        if (!userId) return

        c.stop()
        setTimeout(() => templateInstance.data.onComplete({ userId }), 300)
      })
    })
  },
  'click .accept-area' (event, templateInstance) {
    const name = dataTarget(event, templateInstance)
    const $target = templateInstance.$(`input[name="${name}"`)
    $target.prop('checked', $target.prop('checked') ? '' : true)
  }
})

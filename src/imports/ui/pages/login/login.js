import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import { Schema, RegEx } from '../../../api/schema/Schema'
import { Routes } from '../../../api/routes/Routes'
import { Users } from '../../../contexts/system/accounts/users/User'
import { formIsValid, getFormData } from '../../components/forms/formUtils'
import { codeSchema } from '../../../api/accounts/registration/registerUserSchema'
import loginLanguage from './i18n/loginLanguage'
import dely from 'dely'
import { resolveRedirect } from '../../../api/routes/getResolveRedirect'
import { createInvitationURLQuery } from '../../../contexts/classroom/invitations/url/createInvitationURLQuery'
import './login.html'
import { UserRoles } from '../../../api/roles/UserRoles'
import { userRoutesLoaded } from '../../../api/routes/userRoutesLoaded'

const by300 = dely(300)
const { siteName } = Meteor.settings.public
const schemas = new Map()

const API = Template.login.setDependencies({
  language: loginLanguage
})

Template.login.onCreated(function () {

  this.autorun(() => {
    if (!API.initComplete()) {
      return
    }

    schemas.set('loginSchema', Schema.create({
      email: {
        type: String,
        max: 50,
        label: API.translateReactive('userProfile.email'),
        regEx: RegEx.EmailWithTLD,
        autoform: {
          autofocus: true,
          label: false,
          autocomplete: 'email',
          name: 'email',
          placeholder: API.translateReactive('userProfile.email')
        }
      },
      password: {
        type: String,
        label: API.translateReactive('userProfile.password'),
        autoform: {
          label: false,
          placeholder: API.translateReactive('userProfile.password'),
          afFieldInput: {
            type: 'password'
          },
          autocomplete: true
        }
      }
    }))

    schemas.set('codeFormSchema', Schema.create({
      code: codeSchema({
        label: null,
        autocomplete: false,
        autofocus: true
      })
    }))

    schemas.set('resetEmailSchema', Schema.create({
      email: {
        type: String,
        max: 50,
        label: API.translateReactive('userProfile.email'),
        autoform: {
          autofocus: true,
          autocomplete: false
        }
      }
    }))

    this.state.set('schemasCreated', true)
  })
})

Template.login.onRendered(function () {

  const codeEnter = Router.queryParam('c')
  if (codeEnter) {
    this.$('#registerCodeModal').modal('show')
  }
  else {
    const input = this.$('input[data-schema-key="email"]')
    input.focus()
    input.focus()
    input.focus()
    input.focus()
    input.focus()
  }
})

Template.login.helpers({
  formReady () {
    return Template.getState('schemasCreated')
  },
  loginSchema () {
    return schemas.get('loginSchema')
  },
  loginFailed () {
    return Template.instance().state.get('loginFailed')
  },
  loggingIn () {
    return Template.getState('loggingIn')
  },
  codeSchema () {
    return schemas.get('codeFormSchema')
  },
  resetEmailDoc () {
    return Template.instance().state.get('resetEmail')
  },
  resetEmailSchema () {
    return schemas.get('resetEmailSchema')
  },
  resetPasswordMailSending () {
    return Template.instance().state.get('resetPasswordMailSending')
  },
  resetPasswordMailSent () {
    return Template.instance().state.get('resetPasswordMailSent')
  },
  siteName () {
    return siteName
  }
})

Template.login.events({

  'submit #loginForm' (event, templateInstance) {
    event.preventDefault()

    templateInstance.state.set('loggingIn', true)

    // save temp email in case users
    // fail and want to send a reset link
    const values = getFormData('loginForm')

    if (values.email?.includes('@')) {
      templateInstance.state.set('resetEmail', { email: values.email })
    }

    const loginSchema = schemas.get('loginSchema')
    const insertDoc = formIsValid(loginSchema, 'loginForm', false, API.debug)
    if (!insertDoc) {
      return templateInstance.state.set('loggingIn', false)
    }
    const { email } = insertDoc
    const { password } = insertDoc
    const redirect = resolveRedirect()

    Meteor.loginWithPassword(email, password, (err) => {
      if (err) {
        templateInstance.state.set('loggingIn', false)
        return API.notify(err)
      }

      templateInstance.state.set('loggingIn', false)

      Tracker.autorun(c => {
        if (!Meteor.user() || !UserRoles.subscription.ready() || !userRoutesLoaded.get()) {
          return
        }

        c.stop()
        templateInstance.data.onSuccess(redirect)
      })
    })
  },
  'click .enter-code-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#registerCodeModal').modal('show')
  },
  'submit #codeForm': async (event, templateInstance) => {
    event.preventDefault()
    const codeFormSchema = schemas.get('codeFormSchema')
    const insertDoc = formIsValid(codeFormSchema, 'codeForm', false, API.debug)
    if (!insertDoc) {
      return
    }

    templateInstance.$('#registerCodeModal').modal('hide')

    setTimeout(() => {
      const qp = createInvitationURLQuery(insertDoc)
      const registerPath = Routes.codeRegister.path(qp)
      Router.go(registerPath)
    }, 500)
  },
  'click .forgot-password-link' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#sendResetPasswordMailModal').modal('show')
  },
  'submit #sendResetPasswordForm' (event, templateInstance) {
    event.preventDefault()
    const resetEmailSchema = schemas.get('resetEmailSchema')
    const insertDoc = formIsValid(resetEmailSchema, 'sendResetPasswordForm')
    if (!insertDoc) return

    templateInstance.state.set('resetPasswordMailSending', true)
    Meteor.call(Users.methods.sendResetPasswordEmail.name, insertDoc, by300((err) => {
      templateInstance.state.set('resetPasswordMailSending', false)
      if (err) {
        API.notify(err)
      }
      else {
        templateInstance.state.set('resetPasswordMailSent', true)
      }
    }))
  }
})

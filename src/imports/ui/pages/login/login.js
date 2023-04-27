import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import { i18n } from '../../../api/language/language'
import { Schema, RegEx } from '../../../api/schema/Schema'
import { Routes } from '../../../api/routes/Routes'
import { Users } from '../../../contexts/system/accounts/users/User'
import { formIsValid, getFormData } from '../../components/forms/formUtils'
import { codeSchema, passwordSchemaClassic } from '../../../api/accounts/registration/registerUserSchema'
import loginLanguage from './i18n/loginLanguage'
import dely from 'dely'
import './login.html'
import { resolveRedirect } from '../../../api/routes/getResolveRedirect'

const by300 = dely(300)
const { siteName } = Meteor.settings.public
const schemas = new Map()

const API = Template.login.setDependencies({
  language: loginLanguage
})

Template.login.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    if (!API.initComplete()) {
      return
    }

    const loginSchema = Schema.create({
      usernameOrEmail: {
        type: String,
        max: 50,
        label: () => i18n.get('userProfile.email'),
        regEx: RegEx.EmailWithTLD,
        autoform: {
          autofocus: true,
          label: false,
          autocomplete: 'username',
          placeholder: () => i18n.get('userProfile.email')
        }
      },
      password: passwordSchemaClassic({
        min: null,
        max: null,
        regExp: null,
        hint: false,
        autocomplete: 'current-password'
      })
    })

    const codeFormSchema = Schema.create({
      code: codeSchema({
        label: null,
        autocomplete: false,
        autofocus: true
      })
    })

    const resetEmailSchema = Schema.create({
      email: {
        type: String,
        max: 50,
        label: () => i18n.get('userProfile.email'),
        autoform: {
          autofocus: true,
          autocomplete: false
        }
      }
    })

    schemas.set('loginSchema', loginSchema)
    schemas.set('codeFormSchema', codeFormSchema)
    schemas.set('resetEmailSchema', resetEmailSchema)
    instance.state.set('schemasCreated', true)
  })
})

Template.login.onRendered(function () {
  const instance = this

  const codeEnter = Router.queryParam('c')
  if (codeEnter) {
    instance.$('#registerCodeModal').modal('show')
  }
  else {
    const input = instance.$('input[data-schema-key="usernameOrEmail"]')
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

    if (values.usernameOrEmail && values.usernameOrEmail.includes('@')) {
      templateInstance.state.set('resetEmail', { email: values.usernameOrEmail })
    }

    const loginSchema = schemas.get('loginSchema')
    const insertDoc = formIsValid(loginSchema, 'loginForm', false, API.debug)
    if (!insertDoc) {
      return templateInstance.state.set('loggingIn', false)
    }
    const { usernameOrEmail } = insertDoc
    const { password } = insertDoc
    const redirect = resolveRedirect()

    Meteor.loginWithPassword(usernameOrEmail, password, (err) => {
      if (err) {
        templateInstance.state.set('loggingIn', false)
        return API.notify(err)
      }

      templateInstance.state.set('loggingIn', false)
      setTimeout(() => templateInstance.data.onSuccess(redirect), 500)
    })
  },
  'click .enter-code-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#registerCodeModal').modal('show')
  },
  'submit #codeForm': async function (event, templateInstance) {
    event.preventDefault()
    const codeFormSchema = schemas.get('codeFormSchema')
    const insertDoc = formIsValid(codeFormSchema, 'codeForm', false, API.debug)
    if (!insertDoc) {
      return
    }

    const { CodeInvitation } = await import('../../../contexts/classroom/invitations/CodeInvitations')
    const { initContext } = await import('../../../startup/client/contexts/initContext')
    initContext(CodeInvitation)

    templateInstance.$('#registerCodeModal').modal('hide')

    setTimeout(() => {
      const qp = CodeInvitation.helpers.createURLQuery(insertDoc)
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

import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Wizard } from '../../../../api/wizard/Wizard'
import { Schema, ErrorTypes } from '../../../../api/schema/Schema'
import { i18n } from '../../../../api/language/language'
import { Router } from '../../../../api/routes/Router'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { CodeInvitation } from '../../../../contexts/classroom/invitations/CodeInvitations'
import { Routes } from '../../../../api/routes/Routes'
import { PasswordConfig } from '../../../../api/accounts/registration/PasswordConfig'
import { UserUtils } from '../../../../contexts/system/accounts/users/UserUtils'
import {
  codeSchema, confirmSchema,
  emailSchema,
  firstNameSchema,
  lastNameSchema,
  password2Schema
} from '../../../../api/accounts/registration/registerUserSchema'
import { formIsValid } from '../../../components/forms/formUtils'
import { tokenizeEmail } from '../../../../api/utils/email/splitEmail'
import { confirmDialog } from '../../../components/confirm/confirm'
import { dataTarget } from '../../../utils/dataTarget'
import loginLanguage from '../../login/i18n/loginLanguage'
import codeRegisterLanguage from './i18n/codeRegisterLang'
import '../enroll/enrollAccount.scss'
import './codeRegister.html'
import { currentLanguage } from '../../../../api/language/currentLanguage'

/**
 * This page is used to register users by a given code (transaction number)
 *
 */

const passwordConfig = PasswordConfig.from(Meteor.settings.public.password)
const wizardLoaded = Wizard.init({
  i18n: i18n.get,
  onError (e) {
    API.notify(e)
    setTimeout(() => window.location.reload({ forceReload: true }), 1000)
  }
})

const registerEmailSchema = Schema.create({
  email: emailSchema({
    autofocus: true,
    autocomplete: 'email'
  })
})

const basicRegisterUserSchema = Schema.create({
  code: {
    type: String,
    autoform: {
      disabled: true,
      tabindex: -1
    }
  },
  firstName: firstNameSchema({ autofocus: true }),
  lastName: lastNameSchema()
})

let createPasswordSchema
const acceptTermsSchema = Schema.create({
  privacy: {
    type: Boolean,
    label: () => i18n.get('legal.privacy'),
    custom () {
      if (this.value !== true) {
        return ErrorTypes.REQUIRED
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
        return ErrorTypes.REQUIRED
      }
    },
    autoform: {
      type: 'boolean-checkbox'
    }
  }
})

const codeFormSchema = Schema.create({ code: codeSchema() })
const isStudent = userId => userId && UserUtils.getHighestRole(userId) === UserUtils.roles.student
const ViewStates = {
  basics: 'basics',
  username: 'username',
  password: 'password',
  terms: 'terms',
  register: 'register',
  profile: 'profile',
  failed: 'failed'
}

const API = Template.codeRegister.setDependencies({
  language: {
    de: async () => {
      const loginLang = await loginLanguage.de()
      const registerLang = await codeRegisterLanguage.de()
      return { ...loginLang.default, ...registerLang.default }
    },
    en: async () => {
      const loginLang = await loginLanguage.en()
      const registerLang = await codeRegisterLanguage.en()
      return { ...loginLang.default, ...registerLang.default }
    }
  },
  debug: true
})

Template.codeRegister.onCreated(function () {
  const instance = this
  if (!instance.fail) {
    instance.fail = function (err) {
      instance.state.set('registerFailed', err)
      instance.wizard.clear(true)
      instance.wizard.pushView(ViewStates.failed, ViewStates.failed)
      instance.state.set('loadComplete', true)
    }
  }

  instance.wizard = Wizard.create({
    defaultState: ViewStates.basics
  })

  instance.autorun(() => {
    if (instance.wizard.isCurrentState(ViewStates.password)) {
      // get previous credentials and
      // build a custom rule that forbids to use previous credentials
      const { firstName, lastName } = instance.state.get('basicCredentials')
      const { email } = instance.state.get('usernameDoc')
      const emailSplit = tokenizeEmail(email)
      const emailPrefix = emailSplit.prefix
      const emailDomain = emailSplit.domain

      passwordConfig.blacklist({
        list: [firstName, lastName, emailPrefix, emailDomain],
        message: (value) => i18n.get('login.password.noPreviousCredentials', { password: value })
      })

      const createPasswordSchemaDefinition = {
        email: emailSchema({
          classNames: 'd-none',
          label: false,
          autocomplete: 'email'
        }),
        password: password2Schema({
          min: passwordConfig.min(),
          max: passwordConfig.max(),
          rules: passwordConfig.rules(),
          allowedChars: passwordConfig.allowedChars(),
          icon: passwordConfig.icon(),
          autocomplete: 'new-password',
          autofocus: true
        })
      }

      if (passwordConfig.confirm()) {
        createPasswordSchemaDefinition.confirm = confirmSchema({
          form: 'createPasswordForm',
          min: passwordConfig.min(),
          max: passwordConfig.max(),
          icon: passwordConfig.icon(),
          autocomplete: 'new-password-confirm'
        })
      }

      createPasswordSchema = Schema.create(createPasswordSchemaDefinition)
    }
  })

  try {
    const userId = Meteor.userId()
    const queryParams = Router.queryParam('qp')
    const parsed = CodeInvitation.helpers.parseURLQuery(queryParams)

    Meteor.call(CodeInvitation.methods.verify.name, { code: parsed.code }, (err, validCodeDoc) => {
      if (err) {
        // if there is an error during the check we
        // immediately switch to the failed state
        return instance.fail(err)
      }

      if (!validCodeDoc) {
        // if the code is invalid or expired, we
        // immediately switch to the failed state
        return instance.fail(new Meteor.Error())
      }

      const finalParams = Object.assign({}, parsed, validCodeDoc)
      if (finalParams.classId && isStudent(userId)) {
        API.debug('add to class', finalParams)
        // if we have a given class and the current user is logged an and is a student
        // we display the "join class" modal and ask the student for joining the class
        const { className } = finalParams

        return confirmDialog({
          text: 'codeInvitation.joinClass',
          textOptions: { className },
          type: 'primary',
          static: true,
          timeout: 500
        })
          .then(result => {
            if (result) {
              Meteor.call(CodeInvitation.methods.addToClass.name, { code: finalParams.code }, (err) => {
                if (err) {
                  return API.notify(err)
                } else {
                  API.notify(true)
                  return Router.go(Routes.root.path())
                }
              })
            } else {
              Router.go(Routes.root.path())
            }
          })
          .catch(e => API.notify(e))
      }

      // otherwise we start the new registration wizard
      instance.state.set('queryParams', finalParams)
      instance.state.set('loadComplete', true)
    })
  } catch (e) {
    // as fallback we handle any error during this process as failed
    // and also switch to the failed state
    console.error(e)
    instance.fail(new Meteor.Error('codeInvitation.invalidLink', 'codeInvitation.invalidLinkReason'))
  }
})

Template.codeRegister.helpers({
  loadComplete () {
    return API.initComplete() && wizardLoaded.get() && Template.getState('loadComplete')
  },
  registerUserSchema () {
    return basicRegisterUserSchema
  },
  registerUserDoc () {
    return Template.getState('queryParams')
  },
  emailDoc () {
    const queryParams = Template.getState('queryParams')
    const usernameDoc = Template.getState('usernameDoc')
    const doc = Object.assign({}, queryParams, usernameDoc)
    return doc.email && doc
  },
  usernameFormSchema () {
    return registerEmailSchema
  },
  createPasswordSchema () {
    return createPasswordSchema
  },
  passwordDoc () {
    return Template.getState('usernameDoc')
  },
  acceptTermsSchema () {
    return acceptTermsSchema
  },
  registerFailed () {
    return Template.getState('registerFailed')
  },
  registerSuccessful () {
    return Template.getState('registerSuccessful')
  },
  submitting () {
    return Template.getState('submitting')
  },
  userAlreadyExists () {
    return Template.getState('userAlreadyExists')
  },
  profileImageSchema () {
    return profileImageUploadSchema
  },
  registering () {
    return Template.getState('registering')
  },
  codeSchema () {
    return codeFormSchema
  },
  fullPath () {
    return encodeURIComponent(window.location.href)
  }
})

Template.codeRegister.helpers(Wizard.getHelpers())

Template.codeRegister.events({
  'submit #basicUserCredentialsForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(basicRegisterUserSchema, 'basicUserCredentialsForm')
    if (!insertDoc) {
      return
    }
    templateInstance.state.set('basicCredentials', insertDoc)
    templateInstance.wizard.pushView(ViewStates.username, ViewStates.basics)
  },
  'submit #usernameForm' (event, templateInstance) {
    event.preventDefault()
    event.stopPropagation()

    const insertDoc = formIsValid(registerEmailSchema, 'usernameForm')
    if (!insertDoc) {
      return
    }
    templateInstance.state.set('submitting', true)
    const { email } = insertDoc
    Meteor.call(Users.methods.userIsAvailable.name, { email }, (err, res) => {
      templateInstance.state.set('submitting', false)
      if (err) return API.notify(err)
      if (!res) {
        templateInstance.state.set('userAlreadyExists', true)
      } else {
        templateInstance.state.set('userAlreadyExists', false)
        templateInstance.state.set('usernameDoc', insertDoc)
        templateInstance.wizard.pushView(ViewStates.password, ViewStates.username)
      }
    })
  },

  'submit #createPasswordForm' (event, templateInstance) {
    event.preventDefault()

    const insertDoc = formIsValid(createPasswordSchema, 'createPasswordForm')
    if (!insertDoc) {
      return
    }

    // delete irrelevant data from this step
    delete insertDoc.confirm
    delete insertDoc.email

    templateInstance.state.set('passwordCredentials', insertDoc)
    templateInstance.wizard.pushView(ViewStates.terms, ViewStates.password)
  },
  'submit #acceptTermsForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(acceptTermsSchema, 'acceptTermsForm')
    if (!insertDoc) {
      return
    }

    templateInstance.state.set('registering', true)
    templateInstance.state.set('acceptTermsCredentials', insertDoc)

    const basicCredentials = templateInstance.state.get('basicCredentials')
    const usernameDoc = templateInstance.state.get('usernameDoc')
    const passwordCredentials = templateInstance.state.get('passwordCredentials')
    const locale = currentLanguage()?.code ?? undefined
    const registerWithCodeDoc = Object.assign({}, basicCredentials, passwordCredentials, usernameDoc, { locale })

    Meteor.call(Users.methods.registerWithCode.name, registerWithCodeDoc, (registerError, userId) => {
      templateInstance.state.set('registering', false)
      if (registerError) {
        return templateInstance.fail(registerError)
      }

      if (!userId) {
        return templateInstance.fail(new Meteor.Error('codeInvitation.failed'))
      }
      // if registration completed without errors
      // we try to login and either move to optional profile image state
      // or redirect to login with a success message and let user login
      // on their own behalf
      const { email } = usernameDoc
      const { password } = passwordCredentials

      Meteor.loginWithPassword({ email }, password, (loginError) => {
        if (loginError) {
          console.error(loginError)
          API.notify('codeInvitation.successful')
          Router.go(Routes.login.path())
        } else {
          setTimeout(() => {
            templateInstance.state.set('registerSuccessful', true)
            templateInstance.wizard.pushView(ViewStates.profile, ViewStates.terms)
          }, 1000)
        }
      })
    })
  },
  'click .success-button' (event, templateInstance) {
    event.preventDefault()
    Router.go(Routes.root.path())
  },
  'click .reload-page-button' (event) {
    event.preventDefault()
    window.location.reload({ forceReload: true })
  },
  'submit #codeForm' (event) {
    event.preventDefault()
    const insertDoc = formIsValid(codeFormSchema, 'codeForm')
    if (!insertDoc) return
    const qp = CodeInvitation.helpers.createURLQuery(insertDoc)
    const registerPath = Routes.codeRegister.path(qp)
    Router.go(registerPath)
  },
  'click .accept-area' (event, templateInstance) {
    const name = dataTarget(event, templateInstance)
    const $target = templateInstance.$(`input[name="${name}"`)
    $target.prop('checked', $target.prop('checked') ? '' : true)
  }
})

Template.codeRegister.events(Wizard.getEvents())

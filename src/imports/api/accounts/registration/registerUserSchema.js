import { Meteor } from 'meteor/meteor'
import { i18n } from '../../language/language'
import { Schema } from '../../schema/Schema'
import { onClient } from '../../utils/archUtils'

const nameRegex = /^[^!$%&/^()=?\\{[\]};<>|+#:\d]+$/
const passwordRegExp = '[a-z0-9A-Z_@\\-\\!\\?\\.]+'

export const firstNameSchema = ({ label, max = 50, autofocus, autocomplete, optional = false } = {}) => ({
  type: String,
  optional: optional,
  label: label || i18n.reactive('userProfile.firstName'),
  regEx: nameRegex,
  min: 2,
  max: max,
  autoform: onClient({
    type: 'text',
    autofocus: autofocus,
    autocomplete: autocomplete
  })
})

export const lastNameSchema = ({ max = 50, label, autofocus, autocomplete, optional = false } = {}) => ({
  type: String,
  optional: optional,
  label: label || i18n.reactive('userProfile.lastName'),
  regEx: nameRegex,
  max: max,
  autoform: onClient({
    type: 'text',
    autofocus: autofocus,
    autocomplete: autocomplete
  })
})

export const userNameSchema = ({ label, min = 4, max = 32, regExp = passwordRegExp } = {}) => ({
  type: String,
  label: label || i18n.reactive('userProfile.username'),
  regEx: regExp,
  min: min,
  max: max,
  autoform: onClient({
    hint: i18n.reactive('form.allowedChars') + ': a-z A-Z 0-9 @ _ - .'
  })
})

export const codeSchema = ({ max = 20, label, autofocus, autocomplete } = {}) => ({
  type: String,
  label: label || i18n.reactive('codeRegister.code'),
  max: max,
  autoform: onClient({
    autofocus: autofocus,
    autocomplete: autocomplete
  })
})

let roleSchema

;(function () {
  import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
  const rolesList = Object.values(UserUtils.roles)
  let mappedRoles

  roleSchema = () => ({
    type: String,
    label: i18n.reactive('codeInvitation.role'),
    allowedValues: rolesList,
    autoform: onClient({
      firstOption: () => i18n.reactive('form.selectOne'),
      options: (function () {
        // lazy init mapped roles on client
        if (!mappedRoles) {
          mappedRoles = rolesList.map(role => ({
            value: role,
            label: i18n.reactive(`roles.${role}`)
          }))
        }

        return function () {
          const userId = Meteor.userId()
          const highest = UserUtils.getHighestRole(userId)
          const index = mappedRoles.findIndex(entry => entry.value === highest)
          return mappedRoles.slice(index, mappedRoles.length)
        }
      })()
    })
  })
})()

export { roleSchema }

export const emailSchema = ({ hidden, label, classNames, autofocus, autocomplete, optional } = {}) => ({
  type: String,
  optional: optional,
  label: label || i18n.reactive('userProfile.email'),
  max: 100,
  regEx: () => Schema.provider.RegEx.EmailWithTLD,
  autoform: onClient({
    class: classNames,
    label: false,
    type: hidden ? 'hidden' : 'email',
    autofocus: autofocus,
    autocomplete: autocomplete
  })
})

export const passwordSchemaClassic = ({
  label,
  min = 8,
  max = 64,
  hint,
  autocomplete,
  regExp = passwordRegExp
} = {}) => ({
  type: String,
  label: label || i18n.reactive('userProfile.password'),
  regEx: regExp && new RegExp(regExp),
  min: min,
  max: max,
  autoform: onClient({
    hint: hint && (i18n.reactive('login.passwordHint', { min, max, allowed: 'a-z A-Z 0-9 @ _ - . ! ?' })),
    label: false,
    placeholder: i18n.reactive('userProfile.password'),
    afFieldInput: {
      type: 'password'
    },
    autocomplete: autocomplete
  })
})

export const password2Schema = ({
  min = 8,
  label,
  max = 128,
  optional,
  autocomplete,
  rules,
  regExp,
  visibilityButton,
  visible,
  userIcon,
  css,
  autofocus
} = {}) => ({
  type: String,
  optional: optional,
  label: label || i18n.reactive('login.password.title'),
  min: min,
  max: max,
  autoform: onClient({
    type: 'password2',
    rules: rules,
    autocomplete: autocomplete,
    autofocus: autofocus,
    visibilityButton: visibilityButton,
    visible: visible,
    userIcon: userIcon,
    css: css
  }),
  custom: function () {
    const isUnset = (!this.isSet || !this.value)

    if (optional && isUnset) {
      return true
    }

    // check optional
    if (!optional && isUnset) {
      return Schema.provider.ErrorTypes.REQUIRED
    }
    if (min && this.value.length < min) {
      return Schema.provider.ErrorTypes.MIN_NUMBER
    }
    if (max && this.value.length > max) {
      return Schema.provider.ErrorTypes.MAX_NUMBER
    }
    if (regExp && !regExp.test(this.value)) {
      return Schema.provider.ErrorTypes.FAILED_REGULAR_EXPRESSION
    }

    const value = this.value
    if (rules) {
      let failed
      rules.every(rule => {
        if (!rule.test(value)) {
          failed = rule
          return false
        }
        return true
      })
      return failed ? failed.message(value) : true
    }
  }
})

export const institutionSchema = ({ label, optional = false, max = 250 } = {}) => ({
  type: String,
  label: label || i18n.reactive('codeInvitation.institution'),
  max: max,
  optional: optional
})

export const confirmSchema = ({ label, rules, visibilityButton, visible, userIcon, css } = {}) => ({
  type: String,
  label: label || i18n.reactive('login.confirm'),
  autoform: onClient({
    type: 'password2',
    rules: rules,
    autocomplete: false,
    visibilityButton: visibilityButton,
    visible: visible,
    userIcon: userIcon,
    css: css
  }),
  custom () {
    const password = this.field('password')
    const confirm = this.isSet && this.value
    if (!password || password.value !== confirm) {
      return Schema.provider.ErrorTypes.NOT_EQUAL_CONFIRM || Schema.provider.ErrorTypes.VALUE_NOT_ALLOWED
    }
    return true
  }
})

export const agreementSchema = ({ termsOfServiceLabel, privacyLabel } = {}) => ({
  termsOfService: {
    type: Boolean,
    label: termsOfServiceLabel || i18n.reactive('agreements.termsOfService.read')
  },
  privacyPolicy: {
    type: Boolean,
    label: privacyLabel || i18n.reactive('agreements.privacyPolicy.read')
  }
})

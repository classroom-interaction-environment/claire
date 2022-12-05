import SimpleSchema from 'simpl-schema'
import { createLog } from '../log/createLog'

export const Schema = {}

Schema.name = 'schema'

const debug = createLog({ name: Schema.name, type: 'debug' })

Schema.provider = SimpleSchema

Schema.extendOptions = options => {
  debug('extend options', options)
  SimpleSchema.extendOptions(options)
}

/**
 * Create a new schema.
 * See simpl-schema documentation.
 * @param obj
 * @param options
 */
Schema.create = function create (obj, options = {}) {
  const SchemaClass = Schema.provider
  const instance = new SchemaClass(obj, { ..._defaultOptions, ...options })
  onCreateStack.forEach(fct => fct(instance))
  return instance
}

const onCreateStack = []

Schema.onCreate = function (fct) {
  onCreateStack.push(fct)
}

let _default = {}

/**
 * Set a new default that gets merged
 * with a schema when {withDefault} is called.
 * @param obj
 */
Schema.setDefault = function setDefault (obj) {
  debug('extend default', obj)
  _default = obj
  return _default
}

/**
 * returns the default schema. If non is set returns an empty Object.
 * @return {*}
 */
Schema.getDefault = function getDefault () {
  return Object.assign({}, _default)
}

let _defaultOptions = {}

Schema.setDefaultOptions = function (options) {
  debug('extend default options', options)
  _defaultOptions = options
}

/**
 * Creates a new schema where the current given schema obj is merged with
 * the default schema.
 * @param obj
 * @param options
 */

Schema.withDefault = function withDefault (obj, options) {
  const schema = Object.assign({}, _default, obj)
  return Schema.create(schema, options)
}

Schema.setLanguage = function ({ translate }) {
  debug('set language', translate)
  _translate = translate
}

let _translate = x => x
const translate = str => current => _translate(str, current)

const regExpMessages = {
  [SimpleSchema.RegEx.EmailWithTLD]: () => _translate('form.validation.EmailWithTLD')
  // {exp: SimpleSchema.RegEx.Email, msg: () => i18n.t("SchemaMessages.RegExMessages.email")},
  // {exp: SimpleSchema.RegEx.Domain, msg: () => i18n.t("SchemaMessages.RegExMessages.domain")},
  // {exp: SimpleSchema.RegEx.WeakDomain, msg: () => i18n.t("SchemaMessages.RegExMessages.weakDomain")},
  // {exp: SimpleSchema.RegEx.IP, msg: () => i18n.t("SchemaMessages.RegExMessages.ip")},
  // {exp: SimpleSchema.RegEx.IPv4, msg: () => i18n.t("SchemaMessages.RegExMessages.ipv4")},
  // {exp: SimpleSchema.RegEx.IPv6, msg: () => i18n.t("SchemaMessages.RegExMessages.ipv6")},
  // {exp: SimpleSchema.RegEx.Url, msg: () => i18n.t("SchemaMessages.RegExMessages.url")},
  // {exp: SimpleSchema.RegEx.Id, msg: () => i18n.t("SchemaMessages.RegExMessages.id")},
  // {exp: SimpleSchema.RegEx.ZipCode, msg: () => i18n.t("SchemaMessages.RegExMessages.zipCode")},
  // {exp: SimpleSchema.RegEx.Phone, msg: () => i18n.t("SchemaMessages.RegExMessages.phone")},
}

SimpleSchema.setDefaultMessages({
  defaultLanguage: 'en',
  messages: {
    en: {
      uploadError: translate('form.validation.uploadError'), // file upload
      required: translate('form.validation.required'),
      minString: translate('form.validation.minString'),
      maxString: translate('form.validation.maxString'),
      minNumber: translate('form.validation.minNumber'),
      maxNumber: translate('form.validation.maxNumber'),
      minNumberExclusive: translate('form.validation.minNumberExclusive'),
      maxNumberExclusive: translate('form.validation.maxNumberExclusive'),
      minDate: translate('form.validation.minDate'),
      maxDate: translate('form.validation.maxDate'),
      badDate: translate('form.validation.badDate'),
      minCount: translate('form.validation.minCount'),
      maxCount: translate('form.validation.maxCount'),
      noDecimal: translate('form.validation.noDecimal'),
      notAllowed: translate('form.validation.notAllowed'),
      expectedType: translate('form.validation.expectedType'),
      keyNotInSchema: translate('form.validation.keyNotInSchema'),
      notEqualConfirm: translate('form.validation.notEqualConfirm'),
      userNotUnique: translate('form.validation.userNotUnique'),
      atLeastCharacters: translate('form.password.atLeastCharacters'),
      atMaxCharacters: translate('form.password.atMaxCharacters'),
      atLeastOneLowerCase: translate('form.password.atLeastOneLowerCase'),
      atLeastOneUpperCase: translate('form.password.atLeastOneUpperCase'),
      atLeastOneDigit: translate('form.password.atLeastOneDigit'),
      atLeastoneSpecialChar: translate('form.password.atLeastoneSpecialChar'),
      valueAlreadyExists: translate('form.valueAlreadyExists'),
      genericError: translate('form.genericError'),
      regEx ({ label, regExp }) {
        let msgFn

        if (regExp) {
          msgFn = regExpMessages[regExp]
        }

        const regExpMessage = typeof msgFn === 'function'
          ? msgFn()
          : _translate('form.validation.regEx')
        return `${label} ${regExpMessage}`
      }
    }
  }
})

SimpleSchema.ErrorTypes.NOT_EQUAL_CONFIRM = 'notEqualConfirm'
SimpleSchema.ErrorTypes.MINIMUM_CHARACTERS = 'atLeastCharacters'
SimpleSchema.ErrorTypes.MAXIMUM_CHARACTERS = 'atMaxCharacters'
SimpleSchema.ErrorTypes.LOWER_CHAR_REQUIRED = 'atLeastOneLowerCase'
SimpleSchema.ErrorTypes.UPPER_CHAR_REQUIRED = 'atLeastOneUpperCase'
SimpleSchema.ErrorTypes.DIGIT_CHAR_REQUIRED = 'atLeastOneDigit'
SimpleSchema.ErrorTypes.SPECIAL_CHAR_REQUIRED = 'atLeastoneSpecialChar'
SimpleSchema.ErrorTypes.VALUE_EXISTS = 'valueAlreadyExists'
SimpleSchema.ErrorTypes.GENERIC = 'genericError'

export const RegEx = SimpleSchema.RegEx
export const ErrorTypes = SimpleSchema.ErrorTypes

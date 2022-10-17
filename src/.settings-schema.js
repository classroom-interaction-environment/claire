const SimpleSchema = require('simpl-schema')

const schema = def => new SimpleSchema(def)
const optionalArray = {
  type: Array,
  optional: true
}
const optionalBoolean = {
  type: Boolean,
  optional: true
}

const monitorSchema = schema({
  constructView: optionalBoolean,
  onCreated:optionalBoolean,
  onRendered: optionalBoolean,
  onDestroyed: optionalBoolean,
  registerHelper: optionalBoolean,
  helpers: optionalBoolean,
  events: optionalBoolean
})

const accountsConfigSchema = schema({
  forbidClientAccountCreation: Boolean,
  ambiguousErrorMessages: Boolean,
  sendVerificationEmail: Boolean,
  loginExpirationInDays: SimpleSchema.Integer,
  passwordResetTokenExpirationInDays: SimpleSchema.Integer,
  passwordEnrollTokenExpirationInDays: SimpleSchema.Integer
})

const accountsInformSchema = schema({
  passwordReset: {
    type: String,
    optional: true
  }
})

const filesSchema = schema({
  bucketName: String,
  images: {
    type: Object
  },
  'images.maxSize': Number
})

const accountsFixtureSchema = schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.EmailWithTLD
  },
  institution: String
})

const patchSchema = schema({
  removeDeadReferences: Boolean
})

module.exports = schema({
  defaultLocale: String,
  files: filesSchema,
  curriculum: schema({
    sync: Object,
    'sync.enabled': {
      type: Boolean,
      optional: true
    },
    'sync.username': String,
    'sync.password': String,
    'sync.url': String
  }),
  emailTemplates: schema({
    from: String,
    siteName: String,
    textEncoding: String,
    supportEmail: String
  }),
  accounts: schema({
    admin: accountsFixtureSchema,
    config: accountsConfigSchema,
    inform: accountsInformSchema,
    fixtures: {
      type: Object,
      optional: true
    },
    'fixtures.admin': optionalArray,
    'fixtures.admin.$': accountsFixtureSchema,
    'fixtures.teacher': optionalArray,
    'fixtures.teacher.$': accountsFixtureSchema,
    'fixtures.schoolAdmin': optionalArray,
    'fixtures.schoolAdmin.$': accountsFixtureSchema,
  }),
  patch: patchSchema,
  public: schema({
    features: schema({
      groups:Boolean
    }),
    defaultLocale: String,
    templateMonitor: monitorSchema,
    classroom: schema({ maxUsers: SimpleSchema.Integer }),
    password: schema({
      min: schema({
        value: SimpleSchema.Integer,
        rule: Boolean
      }),
      max: schema({
        value: SimpleSchema.Integer,
        rule: Boolean
      }),
      allowedChars: schema({
        value: String,
        message: String,
        rule: Boolean
      }),
      icon: String,
      confirm: Boolean,
      blacklist: Array,
      'blacklist.$': String
    }),
    "siteName": String
  })
})
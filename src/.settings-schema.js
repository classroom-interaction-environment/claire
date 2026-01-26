module.exports = ({ factory, Integer, RegEx }) => {
  const optionalArray = {
    type: Array,
    optional: true
  }
  const optionalBoolean = {
    type: Boolean,
    optional: true
  }

  const monitorSchema = factory({
    constructView: optionalBoolean,
    onCreated: optionalBoolean,
    onRendered: optionalBoolean,
    onDestroyed: optionalBoolean,
    registerHelper: optionalBoolean,
    helpers: optionalBoolean,
    events: optionalBoolean
  })

  const accountsConfigSchema = factory({
    forbidClientAccountCreation: Boolean,
    ambiguousErrorMessages: Boolean,
    sendVerificationEmail: Boolean,
    loginExpirationInDays: Integer,
    passwordResetTokenExpirationInDays: Integer,
    passwordEnrollTokenExpirationInDays: Integer
  })

  const accountsInformSchema = factory({
    passwordReset: {
      type: String,
      optional: true
    }
  })

  const filesSchema = factory({
    bucketName: String,
    images: {
      type: Object
    },
    'images.maxSize': Number
  })

  const accountsFixtureSchema = factory({
    firstName: String,
    lastName: String,
    email: {
      type: String,
      regEx: RegEx.EmailWithTLD
    },
    institution: String
  })

  const patchSchema = factory({
    removeDeadReferences: {
      type: Boolean,
      optional: true
    },
    imageFiles: {
      type: Boolean,
      optional: true
    },
    admin: {
      type: Boolean,
      optional: true
    },
    roles: {
      type: Boolean,
      optional: true
    }
  })

  return factory({
    defaultLocale: String,
    files: filesSchema,
    curriculum: factory({
      sync: Object,
      'sync.enabled': {
        type: Boolean,
        optional: true
      },
      'sync.username': String,
      'sync.password': String,
      'sync.url': String
    }),
    emailTemplates: factory({
      from: String,
      siteName: String,
      textEncoding: String,
      supportEmail: String
    }),
    accounts: factory({
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
      'fixtures.schoolAdmin.$': accountsFixtureSchema
    }),
    patch: patchSchema,
    public: factory({
      sw: Boolean,
      logLevel: {
        type: Number,
        optional: true,
        allowedValues: [0, 1, 2, 3, 4]
      },
      features: factory({
        groups: Boolean
      }),
      defaultLocale: String,
      templateMonitor: monitorSchema,
      classroom: factory({ maxUsers: Integer }),
      password: factory({
        min: factory({
          value: Integer,
          rule: Boolean
        }),
        max: factory({
          value: Integer,
          rule: Boolean
        }),
        allowedChars: factory({
          value: String,
          message: String,
          rule: Boolean
        }),
        icon: String,
        confirm: Boolean,
        blacklist: Array,
        'blacklist.$': String
      }),
      "siteName": String,
      h5p: factory({
        enabled: Boolean
      })
    })
  })
}
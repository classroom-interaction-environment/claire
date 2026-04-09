import { Meteor } from 'meteor/meteor'
import { auto, onServer, onServerExec } from '../../../../api/utils/archUtils'
import {
  firstNameSchema,
  lastNameSchema,
  emailSchema,
  password2Schema
} from '../../../../api/accounts/registration/registerUserSchema'
import { UserUtils } from './UserUtils'
import { profileImageSchema } from '../../../../api/accounts/schema/profileImageSchema'

export const Users = {
  name: 'users',
  icon: 'user',
  label: 'users.title',
  collection: Meteor.users
}

/**
 * The default public fields that can safely be sent to clients
 */
Users.publicFields = {
  firstName: 1,
  lastName: 1,
  'presence.status': 1
}

Users.schema = {
  username: {
    type: String,
    optional: true
  },
  profileImage: profileImageSchema({ optional: true }),
  emails: {
    type: Array,
    optional: true
  },
  'emails.$': {
    type: Object,
    blackbox: true,
    optional: true
  },
  firstName: firstNameSchema({ optional: true }),
  lastName: lastNameSchema({ optional: true }),
  locale: {
    type: String,
    optional: true
  },
  institution: {
    type: String,
    optional: true
  },
  role: {
    type: String,
    optional: true
  },
  services: {
    type: Object,
    blackbox: true,
    optional: true
  },
  ui: {
    // persistent user interface settings
    // classId: string - the last classId the user has worked with
    // ui: object? - additional ui settings
    // ui.fluid: boolean - whether to use fluid layout
    // ui.guides: object? - tutorial settings
    // ui.guides.[name]: boolean - whether the guides has been shown
    type: Object,
    blackbox: true,
    optional: true
  },
  presence: {
    type: Object,
    blackbox: true,
    optional: true
  }
}

/** @deprecated **/
Users.roles = {
  admin: 'admin',
  editor: 'editor',
  viewer: 'viewer',
  teacher: 'teacher',
  student: 'student',
  beamer: 'beamer',
  sync: 'sync'
}

/** @deprecated **/
Users.groups = {
  base: 'curriculum',
  core: 'core'
}

/****************************
 *
 * HELPERS
 *
 ***************************/

/** @deprecated TODO move helpers into own functions */
Users.helpers = {}

/**
 * Checks, whether a user has verified her email address.
 * TODO extract into a mixin for important methods and publications
 * TODO refactor tests, too
 */

Users.helpers.verify = onServer((user) => {
  if (!user) throw new Meteor.Error('errors.userNotFound')

  const { emails } = user
  if (!emails || !emails[0] || !emails[0].address) {
    throw new Meteor.Error('errors.noEmailFound')
  }
  return Boolean(emails[0].verified)
})

/****************************
 *
 * METHODS
 *
 ***************************/

Users.methods = {}

/**
 *  Sends a verification email by given userId.
 *  Throws if user is already verified, otherwise sends a verification email or fails silently.
 */

Users.methods.resendVerificationMail = {
  name: 'users.methods.resendVerificationMail',
  schema: {},
  isPublic: true,
  numRequests: 1,
  timeInterval: 1000 * 30,
  run: onServerExec(() => {
    const { resendVerificationEmail } = require('./methods/resendVerificationEmail')

    return function ({ userId }) {
      return resendVerificationEmail({ userId: userId || this.userId })
    }
  })
}

/**
 * Part II of double-opt-in method for research participation.
 * Sends a confirmation-email with confirmation-token.
 */
Users.methods.setResearch = {
  name: 'users.methods.setResearch',
  schema: {
    participate: Boolean
  },
  run: onServerExec(() => {
    const { setResearch } = require('./methods/setResearch')

    return function ({ participate }) {
      const { userId } = this
      return setResearch({ userId, participate })
    }
  })
}

/**
 * Final step of double-opt-in for research
 */
Users.methods.confirmResearch = {
  name: 'users.methods.confirmResearch',
  schema: {
    email: String,
    token: String
  },
  run: onServerExec(() => {
    const { confirmResearch } = require('./methods/confirmResearch')

    return ({ email, token }) => confirmResearch({ email, token })
  })
}

/**
 *  Sends a passwort reset link via email to a given email.
 *  Fails silently if the user does not exist.
 */

Users.methods.sendResetPasswordEmail = {
  name: 'users.methods.sendResetPasswordEmail',
  schema: {
    email: emailSchema()
  },
  isPublic: true,
  numRequests: 1,
  timeInterval: 1000 * 60,
  run: onServerExec(() => {
    const { sendResetPasswordEmail } = require('./methods/sendResetPasswordEmail')

    return ({ email }) => sendResetPasswordEmail({ email })
  })
}

/**
 *  Checks if the password reset token is valid and throws the same error, if
 *  - no user exists for the given email
 *  - the has has neither a password nor a reset entry
 *  - the token in reset is unequal to the given token
 *  the same error is thrown to obfuscate and reduce user sniffing capabilities
 */

Users.methods.checkResetpasswordToken = {
  name: 'users.methods.checkResetpasswordToken',
  schema: {
    token: String,
    email: emailSchema(),
    reason: {
      type: String
    }
  },
  isPublic: true,
  numRequests: 1,
  timeInterval: 30000,
  run: onServerExec(() => {
    const { verifyToken } = require('./methods/verifyToken')
    return verifyToken
  })
}

/**
 * Updates a user's profile. Directly sets all properties on the input, so make sure to
 * extend / reduce the schema for string validation.
 */

Users.methods.updateProfile = {
  name: 'users.methods.updateProfile',
  schema: {
    profileImage: profileImageSchema({ optional: true }),
    firstName: firstNameSchema({ optional: true }),
    lastName: lastNameSchema({ optional: true }),
    locale: {
      type: String,
      optional: true
    }
  },
  timeInterval: 1000,
  numRequests: 5,
  run: onServerExec(() => {
    const { updateProfile } = require('./methods/updateProfile')

    return function ({ firstName, lastName, profileImage, locale }) {
      const { userId } = this
      return updateProfile({ userId, firstName, lastName, profileImage, locale })
    }
  })
}

/**
 * Udates a user's persistent UI settings.
 */

Users.methods.updateUI = {
  name: 'users.methods.updateUI',
  schema: {
    fluid: {
      type: Boolean,
      optional: true
    },
    classId: {
      type: String,
      optional: true
    }
  },
  timeInterval: 1000,
  numRequests: 10,
  run: onServerExec(() => {
    const { updateUI } = require('./methods/updateUI')

    return function ({ fluid, classId }) {
      const { userId } = this
      return updateUI({ userId, classId, fluid })
    }
  })
}

/**
 * Marks a guide as viweed
 */

Users.methods.guideViewed = {
  name: 'users.methods.guideViewed',
  schema: {
    guides: {
      type: Array
    },
    'guides.$': {
      type: String
    }
  },
  timeInterval: 1000,
  numRequests: 10,
  run: onServerExec(() => {
    const { updateUI } = require('./methods/updateUI')
    return function ({ guides }) {
      const { userId } = this
      return updateUI({ userId, guides })
    }
  })
}

/**
 *  Returns a user doc without sensitive information. Other users also won't see presence and email.
 */

Users.methods.getUser = {
  name: 'users.methods.getUser',
  schema: {
    _id: String
  },
  run: onServerExec(() => {
    const { getUser } = require('./methods/getUser')

    return function ({ _id }) {
      const { userId } = this
      return getUser({ _id, userId })
    }
  })
}

/**
 * Checks if a username is available.
 */

Users.methods.userIsAvailable = {
  name: 'users.methods.userIsAvailable',
  schema: {
    email: emailSchema()
  },
  timeInterval: 1000,
  numRequests: 1,
  isPublic: true,
  run: onServerExec(() => {
    const { userExists } = require('../../../../api/accounts/user/userExists')

    return async ({ email }) => !(await userExists({ email }))
  })
}

Users.methods.registerWithCode = {
  name: 'users.methods.registerWidthCode',
  schema: auto(() => {
    const { PasswordConfig } = require('../../../../api/accounts/registration/PasswordConfig')
    const passwordConfig = PasswordConfig.from(Meteor.settings.public.password)
    const passwordSchemaDef = {
      min: passwordConfig.min(),
      max: passwordConfig.max(),
      rules: passwordConfig.rules()
    }
    return {
      code: String,
      firstName: firstNameSchema(),
      lastName: lastNameSchema(),
      email: emailSchema(),
      password: password2Schema(passwordSchemaDef),
      locale: {
        type: String,
        optional: true
      }
    }
  }),
  isPublic: true,
  run: onServerExec(() => {
    const { registerWithCode } = require('./methods/registerWithCode')

    return function run (params) {
      return registerWithCode(params)
    }
  })
}

Users.methods.byClass = {
  name: 'user.methods.byClass',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher, UserUtils.roles.student],
  schema: {
    classId: String,
    skip: {
      type: Array,
      optional: true
    },
    'skip.$': String
  },
  run: onServerExec(() => {
    const { usersByClass } = require('./publications/usersByClass')

    return async function ({ classId, skip }) {
      const { userId } = this
      const cursor = await usersByClass({ userId, classId, skip })
      return cursor.fetchAsync()
    }
  })
}

/****************************
 *
 * PUBLICATIONS
 *
 ***************************/

Users.publications = {}

Users.publications.present = {
  name: 'users.publications.present',
  schema: {
    userIds: Array,
    'userIds.$': String
  },
  roles: [UserUtils.roles.teacher],
  run: onServer(({ userIds }) => {
    const query = { _id: { $in: userIds } }
    const projection = {
      fields: {
        firstName: 1,
        lastName: 1
      }
    }
    return Meteor.users.find(query, projection)
  })
}

Users.publications.byClass = {
  name: 'user.publications.byClass',
  roles: [UserUtils.roles.admin, UserUtils.roles.schoolAdmin, UserUtils.roles.teacher, UserUtils.roles.student],
  schema: {
    classId: String
  },
  run: onServerExec(() => {
    const { usersByClass } = require('./publications/usersByClass')
    return async function ({ classId }) {
      const { userId } = this
      return usersByClass({ userId, classId })
    }
  })
}

Users.publications.byGroup = {
  name: 'users.publications.byGroup',
  role: UserUtils.roles.student,
  schema: {
    groupId: String
  },
  run: onServerExec(() => {
    const { usersByGroup } = require('./publications/usersByGroup')

    return async function ({ groupId } = {}) {
      const { userId } = this
      return usersByGroup({ userId, groupId })
    }
  })
}

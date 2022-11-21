import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'
import { createUserSchema } from './createUserSchema'
import { Schema } from '../../schema/Schema'
import { Roles } from 'meteor/alanning:roles'
import { rollbackAccount } from './rollbackAccount'
import { userExists } from '../user/userExists'
import {createLog} from '../../log/createLog'


/**
 * Creates new user accounts
 * @namespace
 */
export const UserFactory = {}

UserFactory.name = 'UserFactory'

const debug = createLog({ name: UserFactory.name, type: 'debug'})
let createSchema

/**
 * Creates a new user account by given options. Args are validated.
 * @param email {string}
 * @param password {string}
 * @param role {string}
 * @param firstName {string}
 * @param lastName {string}
 * @param institution {string}
 * @param locale {string=}
 * @returns {string} the new user's document _id
 * @throws {Meteor.Error} if user exists by given Email
 * @throws {Meteor.Error} if user has not been created
 * @throws {Meteor.Error} if user has not successfully been assigned to given roles
 */
UserFactory.create = function create ({ email, password, role, firstName, lastName, institution, locale }) {
  debug('create new user', { email, institution, role })
  if (!createSchema) {
    createSchema = Schema.create(createUserSchema)
  }

  createSchema.validate({ email, password, role, firstName, lastName, institution })

  // throws if a user with the given email already exists
  if (userExists({ email })) {
    throw new Meteor.Error('createUser.failed', 'user.emailUsed', email)
  }

  // creates a new user for given email address
  const createOptions = { email }

  // creates a user optionally with or without password
  if (password && password.length > 0) {
    createOptions.password = password
  }

  const userId = Accounts.createUser(createOptions)

  if (!userId) {
    throw new Meteor.Error('createUser.failed', 'createUser.notCreated', email)
  }

  // updates the user profile with the minimal defaults
  // strips any unnecessary whitespace from firstName, lastName and institution
  const profileDoc = {
    $set: {
      role,
      firstName,
      lastName,
      institution
    }
  }

  // optionally we can assign a default locale
  // already at this point, for example when the user
  // has set a different locale than the default during
  // registration
  if (locale) {
    profileDoc.$set.locale = locale
  }

  const profileUpdated = Meteor.users.update(userId, profileDoc)

  if (!profileUpdated) {
    rollbackAccount(userId)
    throw new Meteor.Error('createUser.failed', 'createUser.profileNotUpdated', email)
  }

  debug('add user to roles', userId, [role], institution)
  // adds the user to the given roles and scope
  Roles.addUsersToRoles(userId, [role], institution)
  if (!Roles.userIsInRole(userId, [role], institution)) {
    rollbackAccount(userId)
    throw new Meteor.Error('createUser.failed', 'createUser.rolesNotAdded', email)
  }

  return userId
}

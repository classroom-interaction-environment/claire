import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { NotInRolesError } from '../errors/types/NotInRolesError'
import { PermissionDeniedError } from '../errors/types/PermissionDeniedError'
import { UserUtils } from '../../contexts/system/accounts/users/UserUtils'
import { getMinimalRole } from '../accounts/getMinimalRole'
import { userIsCurriculum } from '../accounts/userIsCurriculum'
import { userOwnsDocument } from '../utils/permission/checkOnwership'
import { ensureDocumentExists } from '../utils/document/ensureDocumentExists'

const minimalRole = getMinimalRole()


export const checkPermissions = function (options) {
  const exception = options.isPublic
  if (exception) return options

  const  { curriculum } = options
  const  { admin } = options

  // special permissions can be set by roles and group scopes
  // and they are hierarchical ordered, so a teacher has all roles of a student
  const roles = options.roles || options.role || minimalRole
  const group = options.group

  const runFct = options.run
  options.run = function run (...args) {
    const environment = this
    const { userId } = environment

    // default check for every user: logged in
    if (!userId) {
      throw new PermissionDeniedError('errors.userNotExists', { userId, name: options.name })
    }

    // check if user is admin
    if (admin && !UserUtils.isAdmin(userId)) {
      throw new PermissionDeniedError('errors.userNotAdmin', { userId, name: options.name })
    }

    // check if user needs to be enabled for curriculum
    if (curriculum && !userIsCurriculum(userId)) {
      throw new PermissionDeniedError('errors.userNotCurriculum', { userId, name: options.name })
    }

    // roles / group level permissions
    if (roles) {
      const scope = group || (Meteor.users.findOne(userId)).institution
      if (!Roles.userIsInRole(userId, roles, scope)) {
        const { name } = options
        throw new NotInRolesError({ userId, roles, scope, source: name })
      }
    }

    /** @deprecated import as standalone method */
    environment.checkDoc = (document, docId, userId) => ensureDocumentExists({ document, docId, userId })

    /** @deprecated import as standalone method */
    environment.checkOwner = function (document) {
      if (!userOwnsDocument(document, userId)) {
        throw new PermissionDeniedError('errors.accessDenied', {
          docId: document?._id, userId
        })
      }
    }

    // run function if all pass
    return runFct.apply(environment, args)
  }

  return options
}

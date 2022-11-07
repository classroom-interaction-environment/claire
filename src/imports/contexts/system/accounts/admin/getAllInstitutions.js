import { userIsAdmin } from '../../../../api/accounts/admin/userIsAdmin'
import { PermissionDeniedError } from '../../../../api/errors/types/PermissionDeniedError'

export const getAllInstitutions = ({ userId }) => {
  if (!userIsAdmin(userId)) {
    throw new PermissionDeniedError('roles.notAdmin', { userId })
  }

  return Meteor.roleAssignment.rawCollection().distinct('scope')
}

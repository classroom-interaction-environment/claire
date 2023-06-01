import { UserUtils } from '../../../imports/contexts/system/accounts/users/UserUtils'
import { Random } from 'meteor/random'

export const createCodeDoc = ({ maxUsers = 1, registeredUsers = [], institution = 'Super School', expires = 1, role = UserUtils.roles.student, firstName = 'John', lastName = 'Doe', email = `${Random.id()}@example.com`, classId = Random.id(), invalid = false } = {}) => ({
  _id: Random.id(),
  createdAt: new Date(),
  code: Random.id(4),
  expires: expires,
  role: role,
  firstName: firstName,
  lastName: lastName,
  email: email,
  institution: institution,
  registeredUsers: registeredUsers,
  maxUsers: maxUsers,
  classId: classId,
  invalid: invalid
})

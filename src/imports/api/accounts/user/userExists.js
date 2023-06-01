import { Users } from '../../../contexts/system/accounts/users/User'
import { getCollection } from '../../utils/getCollection'
import { getUserByEmail } from './getUserByEmail'

export const userExists = ({ userId, email } = {}) => {
  if (userId) {
    return getCollection(Users.name).find(userId).count() > 0
  }

  if (email) {
    return !!getUserByEmail(email)
  }

  return false
}

import { Users } from '../../../contexts/system/accounts/users/User'
import { getCollection } from '../../utils/getCollection'

/**
 *
 * @param userId {string}
 * @param email {string}
 * @return {Promise<boolean>}
 */
export const userExists = async ({ userId, email } = {}) => {
  let query

  if (userId) {
    query = { userId }
  }

  if (email) {
    query = { emails: { $elemMatch: { address: email } } }
  }

  if (!query) {
    throw new Error('userExists: either userId or email must be provided')
  }

  const count = await getCollection(Users.name).countDocuments(query)
  return count > 0
}

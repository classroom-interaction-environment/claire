import { getUsersCollection } from '../../utils/getUsersCollection'

/**
 *
 * @param userId {string=}
 * @param email {string=}
 * @return {Promise<boolean>}
 */
export const userExists = async ({ userId, email } = {}) => {
  let query

  if (userId) {
    query = { _id: userId }
  }

  if (email) {
    query = { emails: { $elemMatch: { address: email } } }
  }

  if (!query) {
    throw new Error('userExists: either userId or email must be provided')
  }

  const count = await getUsersCollection().countDocuments(query)
  return count > 0
}

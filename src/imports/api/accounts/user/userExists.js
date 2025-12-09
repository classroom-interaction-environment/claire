import { getUsersCollection } from '../../utils/getUsersCollection'
import { noop } from '../../../utils/noop'

/**
 *
 * @param options {object}
 * @param options.userId {string=}
 * @param options.email {string=}
 * @param options.debug {function=}
 * @return {Promise<boolean>}
 */
export const userExists = async (options = {}) => {
  if (!options) return false

  const { userId, email, debug = noop } = options
  if (!userId && !email) {
    return false
  }
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
  debug('userExists?', { userId, email }, '=>', count)
  return count > 0
}

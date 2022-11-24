import { getUsersCollection } from '../../utils/getUsersCollection'

export const getUserByEmail = email => {
  return getUsersCollection().findOne({ emails: { address: email } })
}

import { getUsersCollection } from '../../utils/getUsersCollection'

export const getUserByEmail = async email => {
  return getUsersCollection().findOneAsync({ emails: { $elemMatch: { address: email } } })
}

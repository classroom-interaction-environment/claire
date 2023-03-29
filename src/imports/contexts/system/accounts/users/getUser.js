import { getUsersCollection } from '../../../../api/utils/getUsersCollection'

export const getUser = query =>
  getUsersCollection(false).findOne(query) ||
  getUsersCollection(true).findOne(query)

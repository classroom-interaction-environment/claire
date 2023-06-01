import { getCollection } from './getCollection'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'

/**
 * This is a special case, since in Meteor the users collection is
 * a property of the Meteor namespace object.
 * However, this creates strong coupling to the Meteor namespace
 * and also makes it much harder to stub users on tests.
 *
 * Since the collection name will not change we can safely hard-code
 * it's value as convention.
 * @return {Mongo.Collection} the Meteor.users collection
 */
export const getUsersCollection = (local = false) => local
  ? getLocalCollection('users')
  : getCollection('users')

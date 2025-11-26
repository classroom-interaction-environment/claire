/**
 * Counts the number of Documents in a Mongo.Collection
 * @param collection {Mongo.Collection} The Mongo.Collection to count documents from
 * @param query {string|object}
 */
export const count = (collection, query = {}) => {
  return collection.countDocuments(query)
}
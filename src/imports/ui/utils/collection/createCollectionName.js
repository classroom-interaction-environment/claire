/**
 * Creates a collection-accessor for every created dependency context.
 * The name's first character is always uppercase and the suffix is 'Collection'
 * Example: 'unit' => 'UnitCollection'
 * @example const { UnitCollection } = API
 * @param name {string} name of the collection
 * @return {string} the new collection name
 */
export const createCollectionName = name => {
  const capitalized = `${name.charAt(0).toUpperCase()}${name.slice(1)}`
  return `${capitalized}Collection`
}

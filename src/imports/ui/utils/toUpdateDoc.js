/**
 * Creates an update doc from the current client-state doc and a given
 * form-updatedoc (that contains $set and $unset modifiers).
 *
 * @param original
 * @param update
 * @return {object}
 */
export const toUpdateDoc = (original, update) => {
  const { $set, $unset = {} } = update
  const updateDoc = Object.assign({}, $set)

  // instead of using the $unset operator, that can sometimes be problematic with the validation and/or clean stage
  // we simple add these fields to the $set operator and make them {null}

  Object.keys($unset).forEach(key => Object.defineProperty(updateDoc, key, {
    value: null,
    enumerable: true,
    writable: true,
    configurable: false
  }))

  const finalDoc = {}

  // then we check for any strict equal fields with the current client-state doc in order to minimize the data
  // that gets sent over the wires when calling the update method

  Object.entries(updateDoc).forEach(([key, value]) => {
    if (original[key] !== value) {
      finalDoc[key] = value
    }
  })

  return finalDoc
}

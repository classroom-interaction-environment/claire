/**
 * Takes an AutoForm updateDoc {{ $set, $unset })
 * and returns a modifier-free doc, where $unset values are set to null
 * @param updateDoc
 * @return {*}
 */
export const updateDocWithoutModifiers = updateDoc => {
  const temp = Object.assign({}, updateDoc.$set)
  Object.keys(updateDoc.$unset || {}).forEach(key => {
    temp[key] = null
  })
  return temp
}

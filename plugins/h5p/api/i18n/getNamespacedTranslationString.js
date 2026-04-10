
// meteor/ostrio:i18n doesn't support namespaces, but they are used in
// @lumieducation/h5p-server. That's why we do a simple conversion to namespace
// strings ourselves.
export const getNamespacedTranslationStrings = (namespace, lngStrings) => {
  return Object.keys(lngStrings).reduce((prev, str) => {
    // eslint-disable-next-line no-param-reassign
    prev[`${namespace}:${str}`] = lngStrings[str]
    return prev
  }, {})
}

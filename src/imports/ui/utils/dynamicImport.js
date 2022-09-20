export const dynamicImport = promises => {
  const promisesList = Array.isArray(promises)
    ? promises
    : [promises]

  const loaded = new ReactiveVar(false)
  if (promises.length > 0) {
    Promise.all(promisesList)
      .then(() => loaded.set(true))
      .catch(e => console.error(e))
  }
  return loaded
}

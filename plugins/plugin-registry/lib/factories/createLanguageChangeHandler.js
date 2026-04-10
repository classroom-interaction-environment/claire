export const createLanguageChangeHandler = ({ target }) => {
  return function (value) {
    // if a function is passed we push it to the change handlers
    if (typeof value === 'function') {
      target.languageChangeHandlers.push(value)
    }

    // otherwise we resolve all registered languages for this value (code)
    // and return them all in a resolved promise
    else {
      const promises = target.languageChangeHandlers.map(fct => fct(value))
      return Promise.all(promises)
    }
  }
}

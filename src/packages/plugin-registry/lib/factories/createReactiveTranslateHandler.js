export const createReactiveTranslateHandler = ({ target }) => {
  return function () {
    return (...args) => () => target.translate(...args)
  }
}

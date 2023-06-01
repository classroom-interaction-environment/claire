import { ReactiveVar } from 'meteor/reactive-var'

export const reactiveDynamicImport = function ({ load, delay = 0 }) {
  const loaded = new ReactiveVar()

  setTimeout(() => {
    load()
      .then(res => {
        loaded.set(!!res)
      })
      .catch(e => console.error(e)) // maybe passing onError handler?
  }, delay)

  return loaded
}

import { ReactiveVar } from "meteor/reactive-var"

export const createReactiveInitialize = asyncInitFct => {
  const init = new ReactiveVar()

  return () => {
    if (!init.get()) {
      asyncInitFct()
        .then(res => init.set(res))
        .catch(e => console.error(e))
    }
    return init
  }
}

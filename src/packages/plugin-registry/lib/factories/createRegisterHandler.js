import { check } from "meteor/check"

export const createRegisterHandler = ({ target, debug }) => {
  return  function (name, /* async */ importFct) {
    debug('register', name)
    check(name, String)
    check(importFct, Function)
    target.registered.set(name, importFct)
  }
}

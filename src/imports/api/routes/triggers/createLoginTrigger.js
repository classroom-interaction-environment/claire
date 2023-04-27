import { loggedOut } from '../../accounts/user/loggedOut'
import { Router } from '../Router'
import { check } from 'meteor/check'

export const createLoginTrigger = (redirectRoute) => {
  check(redirectRoute.path, Function)
  return function loginTrigger () {
    if (loggedOut()) {
      const location = Router.location()
      const fullPath = redirectRoute.path(encodeURIComponent(location))
      Router.go(fullPath)
    }
  }
}

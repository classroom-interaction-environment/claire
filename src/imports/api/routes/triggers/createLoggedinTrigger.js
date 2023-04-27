import { loggedIn } from '../../accounts/user/loggedIn'
import { check } from 'meteor/check'
import { Router } from '../Router'

export const createLoggedinTrigger = (resolveRouteFct) => {
  check(resolveRouteFct, Function)
  return function loggedTrigger () {
    if (loggedIn()) {
      Router.go(resolveRouteFct())
    }
  }
}

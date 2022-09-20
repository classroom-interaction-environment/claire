import { Router } from './Router'

export const createRedirect = (targetRoute, conditionalFn) => () => {
  if (conditionalFn()) {
    Router.go(targetRoute)
  }
}

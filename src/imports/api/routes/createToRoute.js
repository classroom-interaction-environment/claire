import { Router } from './Router'

export const createToRoute = route => (...args) => {
  const path = route.path.apply(null, args)
  Router.go(path)
}

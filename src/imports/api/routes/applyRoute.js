import { Router } from './Router'
import { Routes } from './Routes'

export const applyRoute = (key, ...args) => {
  const route = Routes[key]
  if (!route) {
    return console.warn('cannot apply route', key, ', not found!')
  }
  const targetRoute = route && route.path(...args)
  return Router.go(targetRoute)
}

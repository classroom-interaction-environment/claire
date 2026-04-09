import { Routes } from './Routes'

export const resolveRoute = function resolve (key, ...optionalArgs) {
  const route = Routes[key]
  if (!route) {
    return Routes.notFound.path()
  }
  return route?.path(...optionalArgs)
}

import { Template } from 'meteor/templating'
import { Router } from '../../../api/routes/Router'
import { Routes } from '../../../api/routes/Routes'
import { resolveRoute } from '../../../api/routes/resolveRoute'
import { defaultContainer } from '../../../ui/containers/default/defaultContainer'

Router.setDefaultTarget(defaultContainer)

Object.values(Routes).forEach(route => Router.register(route))

// TODO move global helpers into own file that can be loaded by template via `loaders`

Template.registerHelper('route', function (key, ...optionalArgs) {
  return resolveRoute(key, ...optionalArgs)
})

Template.registerHelper('routeDef', function (key) {
  return Routes[key]
})

Template.registerHelper('referrer', function () {
  const location = Router.location()
  return encodeURIComponent(location)
})

Template.registerHelper('encodeURIComponent', function (value) {
  return encodeURIComponent(value)
})

Template.registerHelper('join', function (char, ...args) {
  args.pop()
  return args.join(char)
})

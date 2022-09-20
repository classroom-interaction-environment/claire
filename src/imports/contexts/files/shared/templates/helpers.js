import { Template } from 'meteor/templating'

Template.registerHelper('b2kb', function (bytes) {
  return (bytes / 1000).toFixed(2)
})

Template.registerHelper('b2mb', function (bytes) {
  return (bytes / 1000000).toFixed(2)
})

Template.registerHelper('b2gb', function (bytes) {
  return (bytes / 1000000000).toFixed(2)
})

import { Template } from 'meteor/templating'

Template.registerHelper('b2kb', (bytes) => (bytes / 1000).toFixed(2))

Template.registerHelper('b2mb', (bytes) => (bytes / 1000000).toFixed(2))

Template.registerHelper('b2gb', (bytes) => (bytes / 1000000000).toFixed(2))

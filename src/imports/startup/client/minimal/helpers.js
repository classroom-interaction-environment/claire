import { Template } from 'meteor/templating'
import * as helpers from '../../../ui/blaze/helpers'

Object.getOwnPropertyNames(helpers).forEach(name => {
  Template.registerHelper(name, helpers[name])
})

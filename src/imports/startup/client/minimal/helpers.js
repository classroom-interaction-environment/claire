import { Template } from 'meteor/templating'
import * as helpers from '../../../ui/blaze/helpers'

// biome-disable  lint/performance/noDynamicNamespaceImportAccess: because we want to register all helpers in the imported file
Object.getOwnPropertyNames(helpers).forEach(name => {
  Template.registerHelper(name, helpers[name])
})

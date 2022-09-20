import { Template } from 'meteor/templating'
import { resolveLinkTypeByUrl } from '../../../lib/resolveLinkTypeByUrl'
import { toExternalUrl } from '../../../lib/toExternalUrl'
import './linkedResourceListRenderer.html'

Template.linkedResourceListRenderer.helpers({
  linkType (url) {
    return resolveLinkTypeByUrl(url)
  },
  toExternalUrl (url) {
    return toExternalUrl(url)
  }
})

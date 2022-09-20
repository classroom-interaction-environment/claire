import { toExternalUrl } from '../../../lib/toExternalUrl'
import './linkedResourceRenderer.html'

Template.linkedResourceRenderer.helpers({
  toExternalUrl (url) {
    return toExternalUrl(url)
  }
})

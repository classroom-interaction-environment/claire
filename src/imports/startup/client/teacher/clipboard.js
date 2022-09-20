import { Meteor } from 'meteor/meteor'
import ClipboardJS from 'clipboard/dist/clipboard'

Meteor.startup(() => {
  return new ClipboardJS('.copy-to-clipboard-button')
})

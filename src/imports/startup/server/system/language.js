import { Meteor } from 'meteor/meteor'
import { initLanguage } from '../../../api/language/initLanguage'

// The following procedures ensure a minimal system-level language setup.
const { siteName, defaultLocale } = Meteor.settings.public
initLanguage(defaultLocale, { siteName }).catch(e => console.error(e))

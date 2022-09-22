import { Meteor } from 'meteor/meteor'
import { initLanguage } from '../../../api/language/initLanguage'

// The following procedures ensure a minimal system-level language setup.
// We set a default language here, which are defined in the deployment settings.
// However, this default is overridden where needed by the user's locale settings.
const { siteName, defaultLocale } = Meteor.settings.public

initLanguage(defaultLocale, { siteName }).catch(e => console.error(e))

import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../api/utils/getCollection'
import { Settings } from '../../../contexts/system/settings/Settings'
import { createLog } from '../../../api/log/createLog'

// If there are no settings defined (for example at the very first start, or they have been deleted)
// then let's create a new default settings document that acts as our initial global state
Meteor.startup(() => {
  const SettingsCollection = getCollection(Settings.name)
  const log = createLog({ name: Settings.name })

  if (SettingsCollection.find().count() === 0) {
    log('init new collection with default settings')
    SettingsCollection.insert(Settings.helpers.defaultSettings())
  }
})

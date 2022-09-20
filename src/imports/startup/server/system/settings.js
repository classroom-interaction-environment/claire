import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../api/utils/getCollection'
import { Settings } from '../../../contexts/system/settings/Settings'

// If there are no settings defined (for example at the beginning or they have been deleted)
// let's create a new default settings document that acts as our initial global state
Meteor.startup(() => {
  const SettingsCollection = getCollection(Settings.name)

  if (SettingsCollection.find().count() === 0) {
    console.log(`[${Settings.name}]: init with default settings`)
    SettingsCollection.insert(Settings.helpers.defaultSettings())
  }
})

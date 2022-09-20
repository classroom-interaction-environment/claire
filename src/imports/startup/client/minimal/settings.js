import { Meteor } from 'meteor/meteor'
import { Settings } from '../../../contexts/system/settings/Settings'

Meteor.startup(() => {
  Settings.helpers.init()
})

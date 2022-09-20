/* global Assets */
import { Meteor } from 'meteor/meteor'
import { VersionStore } from '../../../contexts/system/version/server/store'

Meteor.startup(() => {
  try {
    const versionFile = Assets.getText('version')
    const split = versionFile.split('-')
    VersionStore.tag = split[0]
    VersionStore.commit = split[1]
  } catch (e) {
    console.error(e)
  }
})

import { Meteor } from 'meteor/meteor'
import { AppImages } from '../../../contexts/files/image/AppImages'

Meteor.startup(() => {
  AppImages.helpers.init((err, res) => {
    if (err) {
      console.error(`[${AppImages.name}]: error`, err)
    }
    else {
      console.info(`[${AppImages.name}]: loaded`, res && res.length)
    }
  })
})

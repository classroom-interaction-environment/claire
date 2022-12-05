import { Meteor } from 'meteor/meteor'
import { AppImages } from '../../../contexts/files/image/AppImages'

Meteor.startup(() => {
  AppImages.helpers.init((err) => {
    if (err) {
      console.error(`[${AppImages.name}]: error`, err)
    }
  })
})

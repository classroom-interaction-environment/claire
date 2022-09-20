import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { ProfileImages } from '../../../contexts/files/image/ProfileImages'
import { i18n } from '../../../api/language/language'
import { initContext } from '../contexts/initContext'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

initContext(ProfileImages)

Tracker.autorun(computation => {
  const user = Meteor.user()
  if (!user) { return }

  if (user.profileImage) {
    loadIntoCollection({
      name: ProfileImages.methods.my,
      collection: getLocalCollection(ProfileImages.name),
      failure: error => console.error(ProfileImages.methods.my.name, error),
      debug: true,
      success: () => {
        user.profileImageReady = true
      }
    })
  }

  computation.stop()
})

Tracker.autorun(computation => {
  const user = Meteor.user()
  const langInit = i18n.initialized()
  if (!user || !langInit) { return }

  if (user.locale && user.locale.lang) {
    i18n.setLocale(user.locale.lang)
  }

  computation.stop()
})

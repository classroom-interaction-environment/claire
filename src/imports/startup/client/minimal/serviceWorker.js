import { Meteor } from 'meteor/meteor'
// see https://github.com/NitroBAY/meteor-service-worker
Meteor.startup(() => {
  try {
    setup()
  } catch {}
})

const setup = () => {
  if (!window.navigator.serviceWorker || Meteor.settings.public.sw === false) {
    return
  }

  window.navigator.serviceWorker
    .register('/sw.js')
    .catch(error => console.error('[ServiceWorker]: registration failed: ', error))
}
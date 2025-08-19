import { Meteor } from 'meteor/meteor'
// see https://github.com/NitroBAY/meteor-service-worker
Meteor.startup(() => {
  if (!window.navigator.serviceWorker) {
    return
  }

  window.navigator.serviceWorker
    .register('/sw.js')
    .catch(error => console.error('[ServiceWorker]: registration failed: ', error))
})

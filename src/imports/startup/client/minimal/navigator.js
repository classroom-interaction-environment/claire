import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { Device } from '../../../api/device/Device'
import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'

Meteor.startup(() => {
  const MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)

  Device.isMobile.set(MOBILE)
  Device.isDesktop.set(!MOBILE)

  Tracker.autorun((computation) => {
    if (!Beamer.doc.ready()) return
    const BEAMER = Beamer.doc.isBeamerWindow()
    Device.isBeamer.set(BEAMER)
    computation.stop()
  })
})

Template.registerHelper('isMobile', function () {
  return Device.isMobile.get()
})

Template.registerHelper('isDesktop', function () {
  return Device.isDesktop.get()
})

Template.registerHelper('isBeamer', function () {
  return Device.isBeamer.get()
})

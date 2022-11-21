import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { SubsManager } from '../../../ui/subscriptions/SubsManager'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { getCollection } from '../../../api/utils/getCollection'
import { initContext } from '../contexts/initContext'
import { Notify } from '../../../ui/components/notifications/Notify'

Template.registerHelper('codeOnBeamer', function (compareCode) {
  if (!compareCode) return false
  const beamerDoc = Beamer.doc.get()
  return beamerDoc && beamerDoc.invitationCode === compareCode
})

/**
 *
 *  Beamer doc subscription Tracker
 *
 */

Meteor.startup(() => {
  initContext(Beamer)

  let beamerSub
  Beamer.actions.debug(Meteor.isDevelopment)

  Tracker.autorun((computation) => {
    // start an initial subscription to the beamer document
    if (!beamerSub) {
      beamerSub = SubsManager.subscribe(Beamer.publications.my.name)
    }

    if (beamerSub.ready()) {
      const beamerDoc = getCollection(Beamer.name).findOne()

      if (beamerDoc) {
        // if we have already a beamer doc four our user, let's
        // set everything to ready, so Templates can start rendering
        Beamer.doc.ready(true)
        Beamer.actions.restore()
        computation.stop()
      }

      else {
        // otherwise we need to create a new beamer doc
        Beamer.doc.create((err, newBeamerDoc) => {
          if (err) return Notify.error(err)
          if (!newBeamerDoc) {
            return Notify.add(new Error('beamer doc is not created'))
          }
          Beamer.doc.ready(true)
          Beamer.actions.restore()
          computation.stop()
        })
      }
    }
  })
})

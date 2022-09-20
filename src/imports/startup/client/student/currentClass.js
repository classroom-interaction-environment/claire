import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { CurrentClass } from '../../../ui/controllers/student/CurrentClass'

/**
 * In this startup method we check, if the current user
 * has any classId being saved to her profile.
 * In this case we immediately set this classId as the current class
 * and stop all the computation.
 */

Meteor.startup(() => {
  Tracker.autorun(computation => {
    const user = Meteor.user()
    if (!user) return

    const classId = user.ui && user.ui.classId
    if (classId) CurrentClass.set(classId)

    computation.stop()
  })
})

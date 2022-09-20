import { Meteor } from 'meteor/meteor'
import { ReactiveVar } from 'meteor/reactive-var'
import { Users } from '../../../contexts/system/accounts/users/User'
import { Notify } from '../../components/notifications/Notify'

const currentClass = new ReactiveVar(null)

export const CurrentClass = {
  set (classId) {
    if (!classId && currentClass.get()) return
    Meteor.call(Users.methods.updateUI.name, { classId }, (err) => {
      if (err) Notify.add({ type: 'danger', autohide: false, title: err.message })
    })
    return currentClass.set(classId)
  },
  get () {
    return currentClass.get()
  },
  clear () {
    return currentClass.set(null)
  }
}

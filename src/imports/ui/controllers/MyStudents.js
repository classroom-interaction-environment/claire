import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Tracker } from 'meteor/tracker'
import { ReactiveVar } from 'meteor/reactive-var'
import { SubsManager } from '../subscriptions/SubsManager'
import { Users } from '../../contexts/system/accounts/users/User'
import { loggedIn } from '../../api/accounts/user/loggedIn'

const _callbacks = {}
const _currentClass = new ReactiveVar()
const _currentUsers = new ReactiveVar()
let _handle

export const MyStudents = {}

MyStudents.currentClass = function () {
  return _currentClass.get()
}

MyStudents.currentUsers = function () {
  return _currentUsers.get()
}

MyStudents.setClass = function (classId, cb) {
  check(classId, String)
  if (_currentClass.get() !== classId) {
    _currentClass.set(classId)
    _callbacks[classId] = cb
  } else {
    return cb && cb()
  }
}

MyStudents.ready = function () {
  return _handle && _handle.ready()
}

Meteor.startup(() => {
  Tracker.autorun(() => {
    if (!loggedIn()) return

    const classId = MyStudents.currentClass()
    if (!classId) return

    _handle = SubsManager.subscribe(Users.publications.byClass.name, { classId })
    if (_handle.ready() && _callbacks[classId]) {
      _callbacks[classId]()
      delete _callbacks[classId]
    }
  })
})

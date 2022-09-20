/* global Facts */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { cursor } from '../../../../../api/utils/cursor'
import './stats.html'

Template.adminStats.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const handle = Meteor.subscribe('meteor_facts')
    if (handle.ready()) {
      instance.state.set('loadComplete', true)
    }
  })
})

Template.adminStats.helpers({
  docs () {
    return cursor(() => Facts.find())
  }
})

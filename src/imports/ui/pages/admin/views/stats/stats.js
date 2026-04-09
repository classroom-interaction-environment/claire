/* global Facts */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { cursor } from '../../../../../api/utils/cursor'
import './stats.html'

Template.adminStats.onCreated(function () {

  this.autorun(() => {
    const handle = Meteor.subscribe('meteor_facts')
    if (handle.ready()) {
      this.state.set('loadComplete', true)
    }
  })
})

Template.adminStats.helpers({
  docs () {
    return cursor(() => Facts.find())
  }
})

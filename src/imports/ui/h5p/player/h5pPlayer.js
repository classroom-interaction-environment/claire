import { Meteor } from 'meteor/meteor'
import { ReactiveVar } from 'meteor/reactive-var'
import { Template } from 'meteor/templating'
import { H5PMeteor } from 'meteor/claire:h5p'
import { i18n } from '../../../api/language/language'
import { defineElements } from '@lumieducation/h5p-webcomponents' // This will register the <h5p-player/>
import './h5pPlayer.html'

defineElements('h5p-player')

// TODO add lang
Template.h5pPlayer.setDependencies({})

Template.h5pPlayer.onCreated(function () {
  const instance = this
  instance.xApiOutput = new ReactiveVar([])
})

Template.h5pPlayer.onRendered(function () {
  const instance = this
  const player = instance.$('.player')[0]
  player.addEventListener('initialized', function () {
    const H5Pns = player.h5pObject
    H5Pns.externalDispatcher.on('xAPI', function (event) {
      const { statement } = event.data
      // actor is empty by default, so we enrich her with our
      // Meteor user credentials to create an opaque account
      const user = Meteor.user()
      statement.actor.name = user.username
      statement.actor.account = {
        homePage: Meteor.absoluteUrl(),
        name: user._id
      }
      statement.context = statement.context || {}
      statement.context.platform = 'h5p-Meteor'
      statement.context.language = i18n.currentLocale.get()
      statement.timestamp = new Date().toISOString()
      const log = instance.xApiOutput.get()
      log.push({
        name: statement.actor.name,
        objectType: statement.object.objectType,
        timestamp: statement.timestamp,
        verb: statement.verb.display['en-US'],
        contentId: statement.object.definition.extensions['http://h5p.org/x-api/h5p-local-content-id'],
        item: statement.object.definition.name['en-US'],
        result: statement.result && JSON.stringify(statement.result, null, 0)
      })
      instance.xApiOutput.set(log)
    })
  })
  // We set the callback on the player webcomponent. When the contentId is set
  // through the template binding, the player will render.
  player.loadContentCallback = async (contentId) => {
    return new Promise((resolve, reject) => {
      Meteor.call(H5PMeteor.methods.loadContentForPlaying.name, { contentId }, (err, result) => {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }
})

Template.h5pPlayer.helpers({
  xApiOutput () {
    return Template.instance().xApiOutput.get()
  },
  stringify (obj) {
    return obj && JSON.stringify(obj, null, 0)
  }
})

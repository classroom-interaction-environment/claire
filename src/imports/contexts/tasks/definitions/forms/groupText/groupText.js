/* global AutoForm $ */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { TaskResults } from '../../../results/TaskResults'
import { getCollection } from '../../../../../api/utils/getCollection'
import { debounce } from '../../../../../api/utils/debounce'
import groupTextLanguage from './i18n/groupTextLanguage'
import './groupText.scss'
import './groupText.html'

const subKey = 'groupTextSub'

AutoForm.addInputType('groupText', {
  template: 'afGroupText',
  valueOut () {
    return this.val()
  }
})

const API = Template.afGroupText.setDependencies({
  contexts: [TaskResults],
  language: groupTextLanguage
})

Template.afGroupText.onCreated(function () {
  const instance = this
  instance.autorun(() => {
    const data = Template.currentData()
    const groupId = data.atts['data-group']
    const groupMode = data.atts['data-group-mode']
    const itemId = data.atts['data-item']

    // skip subs if no data is passed on
    if (!groupId || !itemId) {
      return instance.state.set({ subReady: true, subscribed: false })
    }

    API.subscribe({
      name: TaskResults.publications.byGroup,
      args: { itemId, groupId },
      key: subKey,
      callbacks: {
        onError: API.notify,
        onReady () {
          instance.state.set({
            subReady: true,
            subscribed: true,
            itemId,
            groupId,
            groupMode
          })
        }
      }
    })
  })
})

Template.afGroupText.onDestroyed(function () {
  const subscribed = this.state.get('subscribed')
  if (subscribed) API.dispose(subKey)
})

Template.afGroupText.onRendered(function () {
  const instance = this

  instance.autorun(c => {
    const itemId = instance.state.get('itemId')
    if (!instance.state.get('subReady') || !itemId) {
      return
    }

    const myDoc = getCollection(TaskResults.name).findOne({ itemId, createdBy: Meteor.userId() })

    if (myDoc) {
      setTimeout(() => instance.$('.my-text').val(myDoc.response[0]), 300)
    }

    // clear computation since this is just for the initial value
    c.stop()
  })
})

Template.afGroupText.helpers({
  loadComplete () {
    return API.initComplete() && Template.getState('subReady')
  },
  dataSchemaKey () {
    return Template.currentData().atts['data-schema-key']
  },
  groupOutputs () {
    const userId = Meteor.userId()
    const itemId = Template.getState('itemId')
    if (!userId || !itemId) { return }
    return getCollection(TaskResults.name).find({ itemId, createdBy: { $ne: userId } })
  }
})

Template.afGroupText.events({
  'input .my-text': debounce(function (event, templateInstance) {
    $(event.currentTarget).closest('form').submit()
  }, 300)
})

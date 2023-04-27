/* global AutoForm $ */
import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { Template } from 'meteor/templating'
import { TaskResults } from '../../../results/TaskResults'
import { Group } from '../../../../classroom/group/Group'
import { getCollection } from '../../../../../api/utils/getCollection'
import { debounce } from '../../../../../api/utils/debounce'
import { callMethod } from '../../../../../ui/controllers/document/callMethod'
import { withProperty } from '../../../../../api/utils/object/withProperty'
import groupTextLanguage from './i18n/groupTextLanguage'
import './groupText.scss'
import './groupText.html'
import { dataTarget } from '../../../../../ui/utils/dataTarget'

const subKey = 'groupTextSub'
const ensureObject = (target, name) => withProperty(target, name, {})

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
  const userId = Meteor.userId()

  instance.getMemberUpdates = ({ reactive = false } = {}) => reactive
    ? instance.state.get('memberUpdates') || {}
    : Tracker.nonreactive(() => instance.state.get('memberUpdates')) || {}

  // fetching data on new groupId and itemId
  instance.autorun(() => {
    const data = Template.currentData()
    const groupId = data.atts['data-group']
    const groupMode = data.atts['data-group-mode']
    const itemId = data.atts['data-item']

    // skip subs if no data is passed on
    if (!groupId || !itemId) {
      return instance.state.set({ subReady: true, subscribed: false })
    }

    callMethod({
      name: Group.methods.users,
      args: { groupId },
      failure: API.notify,
      success: (groupMembers) => instance.state.set({ groupMembers })
    })

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

  // once data has been loaded we want to observe changes
  // for the "other" group members and add a state if new content is there
  instance.autorun(() => {
    const loadComplete = API.initComplete() && instance.state.get('subReady')
    const groupMembers = instance.state.get('groupMembers')
    const itemId = instance.state.get('itemId')

    if (!loadComplete || !itemId || !groupMembers) {
      return // skip until loaded
    }

    instance.observer = getCollection(TaskResults.name).find({ itemId, createdBy: { $ne: userId } }).observeChanges({
      added (id, doc) {
        const user = groupMembers.find(({ _id }) => _id === doc.createdBy)

        if (!user) {
          return console.warn(`Observer: added taskresult doc but found no user for doc ${id}`)
        }

        const foundUserId = user._id
        const memberUpdates = instance.getMemberUpdates({ reactive: false })
        ensureObject(memberUpdates, foundUserId)
        // we set false here, since this is only for resolving the ids
        // once the doc is added to the collection
        // otherwise we would get an indicator of changes
        // on every page reload
        memberUpdates[foundUserId].status = true
        memberUpdates[foundUserId].docId = id
        instance.state.set({ memberUpdates })
      },
      changed (id) {
        const memberUpdates = instance.getMemberUpdates({ reactive: false })
        const [foundUserId] = Object.entries(memberUpdates).find(([_id, entry]) => entry.docId === id)

        if (!foundUserId) {
          return console.warn(`Observer: updated taskresult doc but found no user for doc ${id}`)
        }

        memberUpdates[foundUserId].status = true
        instance.state.set({ memberUpdates })
      }
    })
  })
})

Template.afGroupText.onDestroyed(function () {
  const instance = this

  if (instance.state.get('subscribed')) {
    API.dispose(subKey)
  }

  if (instance.observer) {
    instance.observer.stop()
  }
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
    return API.initComplete() && Template.getState('subReady') && Template.getState('groupMembers')
  },
  dataSchemaKey () {
    return Template.currentData().atts['data-schema-key']
  },
  groupMembers () {
    return Template.getState('groupMembers')
  },
  hasUpdate (userId) {
    const updates = Template.instance().getMemberUpdates({ reactive: true })
    const updatedDoc = updates?.[userId]
    return updatedDoc?.status
  },
  memberResponse (userId) {
    const itemId = Template.getState('itemId')
    const responseDoc = getCollection(TaskResults.name).findOne({ itemId, createdBy: userId })
    return responseDoc?.response
  }
})

Template.afGroupText.events({
  'input .my-text': debounce(function (event, templateInstance) {
    $(event.currentTarget).closest('form').submit()
  }, 300),
  'click .group-member-tab' (event, templateInstance) {
    const userId = dataTarget(event, templateInstance, 'user')
    const otherTab = dataTarget(event, templateInstance)
    const memberUpdates = templateInstance.getMemberUpdates({ reactive: false })

    if (memberUpdates[userId]) {
      memberUpdates[userId].status = false
      templateInstance.state.set({ memberUpdates })
    }

    templateInstance.$(otherTab).tab('show')
  }
})

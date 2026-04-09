import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { SubsManager } from '../../../../subscriptions/SubsManager'

import { Schema } from '../../../../../api/schema/Schema'
import { Errors } from '../../../../../contexts/system/errors/Errors'
import { dataTarget } from '../../../../utils/dataTarget'
import { getCollection } from '../../../../../api/utils/getCollection'
import { initContext } from '../../../../../startup/client/contexts/initContext'

import './log.html'

initContext(Errors)
const ErrorsCollection = getCollection(Errors.name)
const filterLogsSchema = Schema.create(Errors.filter.schema, { tracker: Tracker })

Template.adminLogs.onCreated(function onLogCreated () {
  this.state.set('showDocs', {})
  this.autorun(() => {
    const logSub = SubsManager.subscribe(Errors.publications.byDate.name, { limit: 100 })
    if (logSub.ready()) {
      const cursor = ErrorsCollection.find()
      this.state.set('logCount', cursor?.count())
      this.state.set('loadComplete', true)
    }
  })
})

Template.adminLogs.helpers({
  filterLogsSchema () {
    return filterLogsSchema
  },
  logCount () {
    return Template.getState('logCount') || 0
  },
  maxCount () {
    return Template.getState('maxCount') || 0
  },
  errors () {
    return ErrorsCollection.find()
  },
  show (docId) {
    const showDocs = Template.getState('showDocs')
    return showDocs?.[docId]
  }
})

Template.adminLogs.events({
  'click .errorlog-show-button' (event, templateInstance) {
    event.preventDefault()

    const docId = dataTarget(event, templateInstance)
    const showDocs = templateInstance.state.get('showDocs')
    showDocs[docId] = !showDocs[docId]
    templateInstance.state.set('showDocs', showDocs)
  }
})

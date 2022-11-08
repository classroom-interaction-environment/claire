import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Defaults } from '../../../api/defaults/Defaults'
import { Schema } from '../../../api/schema/Schema'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { cursor } from '../../../api/utils/cursor'
import { dataTarget } from '../../utils/dataTarget'
import { confirmDialog } from '../../components/confirm/confirm'
import { delayedCallback } from '../../utils/delayedCallback'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { createMaterialPreview } from '../../../contexts/material/createMaterialPreview'
import taskWizardLanguage from './i18n/taskWizardLanguage'
import '../../components/forms/create/createForm'
import '../../components/documentState/documentState'
import './taskWizard.html'

const API = Template.taskWizard.setDependencies({
  contexts: [Unit, Task],
  language: taskWizardLanguage
})
const sort = { sort: { updatedAt: -1 } }
const defaultSchema = Defaults.schema()
const TaskCollection = getLocalCollection(Task.name)
const UnitCollection = getLocalCollection(Unit.name)
const taskSchemaDefinitions = Object.assign({}, {
  title: defaultSchema.title,
  description: defaultSchema.description
}, Task.schema)

const createTaskSchema = Schema.create(taskSchemaDefinitions)
const createTaskDoc = Task.helpers.createData()

Template.taskWizard.onCreated(function () {
  const instance = this

  loadIntoCollection({
    name: Task.methods.my,
    collection: TaskCollection,
    failure: API.fatal,
    success: () => instance.state.set('tasksReady', true)
  })

  loadIntoCollection({
    name: Unit.methods.my,
    collection: UnitCollection,
    failure: API.fatal,
    success: () => instance.state.set('unitsReady', true)
  })
})

Template.taskWizard.helpers({
  loadComplete () {
    return API.initComplete() && Template.getState('tasksReady')
  },
  tasks () {
    const query = {
      createdBy: Meteor.userId(),
      _master: { $exists: false },
      _custom: { $exists: false }
    }
    return cursor(() => TaskCollection.find(query, sort))
  },
  customTasks () {
    const query = {
      createdBy: Meteor.userId(),
      _custom: { $exists: true }
    }
    return cursor(() => TaskCollection.find(query, sort))
  },
  masterTasks () {
    const query = {
      createdBy: Meteor.userId(),
      _master: { $exists: true }
    }
    return cursor(() => TaskCollection.find(query, sort))
  },
  createTaskSchema () {
    return createTaskSchema
  },
  createTaskMethod () {
    return Task.methods.insert.name
  },
  createTaskDoc () {
    return createTaskDoc
  },
  previewMaterial () {
    return Template.getState('previewMaterial')
  }
})

Template.taskWizard.events({
  'click .view-task-button': async (event, templateInstance) => {
    event.preventDefault()

    // TODO move into own function like "previewMaterial"
    const docId = dataTarget(event, templateInstance)
    const contextName = Task.name

    try {
      const previewMaterial = await createMaterialPreview({
        docId,
        contextName,
        templateInstance
      })
      templateInstance.state.set({ previewMaterial })
      setTimeout(() => API.showModal('material-preview-modal'), 100)
    }
    catch (e) {
      API.notify(e)
    }
  }
})

Template.twRenderer.helpers({
  getUnit (taskId) {
    const unitDoc = UnitCollection.findOne({ tasks: taskId }, sort)
    return unitDoc?._id
  },
  deleting (_id) {
    return Template.getState('deleteTarget') === _id
  }
})

Template.twRenderer.events({
  'click .delete-task-button' (event, templateInstance) {
    event.preventDefault()
    const taskId = dataTarget(event, templateInstance)
    const task = TaskCollection.findOne(taskId)
    const { title } = task

    Meteor.call(Unit.methods.byTaskId.name, { taskId }, (err, units = []) => {
      if (err) return API.notify(err)

      let text
      let textOptions

      if (units.length) {
        text = 'wizard.task.confirmDeleteLinked'
        textOptions = {
          title: title,
          units: '\n\n' + units.map(doc => `\u00B7 ${doc.title}`).sort().join('\n\n')
        }
      }

      else {
        text = 'wizard.task.confirmDelete'
        textOptions = {
          title: title
        }
      }

      confirmDialog({ text, textOptions, codeRequired: true, type: 'danger' })
        .then(result => {
          if (!result) return

          templateInstance.state.set('deleteTarget', taskId)
          Meteor.call(Unit.methods.unlinkTask.name, { taskId }, err => {
            templateInstance.state.set('deleteTarget', null)
            if (err) return API.notify(err)

            Meteor.call(Task.methods.remove.name, { _id: taskId }, delayedCallback(300, (err, res) => {
              if (err) {
                return API.notify(err)
              }

              if (!res) {
                return API.notify(new Error('errors.deleteFailed'))
              }

              API.notify(true)
            }))
          })
        })
        .catch(e => API.notify(e))
    })
  }
})

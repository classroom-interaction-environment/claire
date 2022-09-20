import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { Curriculum } from '../../../../contexts/curriculum/Curriculum.js'
import { Shared } from '../helpers/shared'
import { Schema } from '../../../../api/schema/Schema'
import { Task } from '../../../../contexts/curriculum/curriculum/task/Task'
import { dataTarget } from '../../../utils/dataTarget'
import { confirmDialog } from '../../../components/confirm/confirm'
import { formIsValid, formReset } from '../../../components/forms/formUtils'
import { updateContextDoc } from '../../../controllers/document/updateContextDoc'
import '../pagecontent/pageContent'
import './taskPages.html'

/*******************************************************************************
 * This Template manages the pages of a task document. A task can place all it's
 * content on one single page or have it spread across multiple pages.
 * Therefore this Template covers
 * - adding pages
 * - editing pages
 * - deleting pages
 * - passing data through to a pageContent Template with ref to the current page
 *******************************************************************************/

const API = Template.taskPages.setDependencies({
  contexts: [Task]
})

const defaultSchema = Curriculum.getDefaultSchema()

const titleSchema = Schema.create({
  title: defaultSchema.title
}, { tracker: Tracker })

Template.taskPages.onCreated(function () {
  const instance = this
  instance.state.set('currentIndex', 0)

  // bind fct
  Shared.updatePage = function (index, page) {
    instance.state.set('currentIndex', index)
    instance.state.set('currentPage', page)
  }

  instance.autorun(function () {
    const data = Template.currentData()
    const { taskDoc } = data

    if (!instance.state.get('currentPage')) {
      instance.state.set('currentPage', (taskDoc.pages && taskDoc.pages[0]) || {
        title: '',
        content: []
      })
    }

    instance.state.set('taskDoc', taskDoc)
    instance.state.set('pages', taskDoc.pages)
  })
})

Template.taskPages.helpers({
  taskPageTitleSchema () {
    return titleSchema
  },
  pageTitleDoc () {
    const currentPage = Template.getState('currentPage')
    return currentPage && { title: currentPage.title }
  },
  pages () {
    return Template.getState('pages')
  },
  currentPage () {
    return Template.getState('currentPage')
  },
  isOnlyPage () {
    const pages = Template.getState('pages')
    return !pages || pages.length < 2
  },
  currentIndex () {
    return Template.getState('currentIndex')
  },
  isActive (index) {
    return Template.getState('currentIndex') === index
  },
  hasTarget () {
    const target = Shared.cache.get('target')
    return target !== null && typeof target !== 'undefined'
  },
  task () {
    return Template.getState('taskDoc')
  },
  hasContent (index) {
    const pages = Template.getState('pages')
    const page = pages[index]
    return page && page.content && page.content.length > 0
  },
  submitting () {
    return Template.getState('submitting')
  }
})

Template.taskPages.events({
  'click .create-page-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#newPageModal').modal('show')
  },
  'hidden.bs.modal #newPageModal' () {
    formReset('createPageForm')
  },
  'submit #createPageForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(titleSchema, 'createPageForm')
    if (!insertDoc) {
      return
    }

    const taskDoc = templateInstance.state.get('taskDoc')
    const targetIndex = taskDoc.pages.length
    const pages = taskDoc.pages || []
    taskDoc.pages.push({ title: insertDoc.title, content: [] })

    updateContextDoc({
      context: Task,
      _id: taskDoc._id,
      doc: { title: taskDoc.title, pages },
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => {
        templateInstance.$('#newPageModal').modal('hide')
        setTimeout(() => {
          formReset('createPageForm')

          const updatedTask = templateInstance.state.get('taskDoc')
          Shared.cache.set('target', `pages.${targetIndex}`)
          Shared.updatePage(targetIndex, updatedTask.pages[targetIndex])
        }, 300)
      }
    })
  },
  'click #edit-pagetitle-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#editPageModal').modal('show')
  },
  'hidden.bs.modal #editPageModal,#newPageModal' () {
    formReset('editPageForm')
    formReset('createPageForm')
  },
  'submit #editPageForm' (event, templateInstance) {
    event.preventDefault()
    const insertDoc = formIsValid(titleSchema, 'editPageForm')
    if (!insertDoc) {
      return
    }
    templateInstance.state.set('submitting', true)
    const targetIndex = templateInstance.state.get('currentIndex')
    const taskDoc = templateInstance.state.get('taskDoc')
    taskDoc.pages[targetIndex].title = insertDoc.title

    updateContextDoc({
      context: Task,
      _id: taskDoc._id,
      doc: { title: taskDoc.title, pages: taskDoc.pages },
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => {
        templateInstance.$('#editPageModal').modal('hide')

        setTimeout(() => {
          formReset('editPageForm')
        }, 300)
      }
    })
  },

  'click #update-pagetitle-delete-button' (event, templateInstance) {
    event.preventDefault()
    confirmDialog({ text: 'editor.task.confirmDeletePage' })
      .then(result => {
        if (!result) return

        const index = dataTarget(event, templateInstance)
        const taskDoc = templateInstance.state.get('taskDoc')
        taskDoc.pages.splice(index, 1)

        updateContextDoc({
          context: Task,
          _id: taskDoc._id,
          doc: { pages: taskDoc.pages },
          prepare: () => templateInstance.state.set('submitting', true),
          receive: () => templateInstance.state.set('submitting', false),
          failure: er => API.notify(er),
          success: () => {
            Shared.cache.set('target', null)
            Shared.updatePage(0, taskDoc.pages[0])
            API.notify()
          }
        })
      })
      .catch(e => API.notify(e))
  },
  'click .page-tab-button' (event, templateInstance) {
    event.preventDefault()
    const targetIndex = parseInt(dataTarget(event, templateInstance), 10)
    const taskDoc = templateInstance.state.get('taskDoc')
    Shared.updatePage(targetIndex, taskDoc.pages[targetIndex])
  }
})

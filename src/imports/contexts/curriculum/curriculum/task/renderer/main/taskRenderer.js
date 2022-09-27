import { Template } from 'meteor/templating'
import { Tracker } from 'meteor/tracker'
import { check, Match } from 'meteor/check'
import { confirmDialog } from '../../../../../../ui/components/confirm/confirm'
import { getTaskContexts } from '../../../../../tasks/getTaskContexts'
import taskrendererLang from './i18n/taskRendererLang'
import './taskRendererFactory'
import './taskRenderer.scss'
import './taskRenderer.html'

/* ****************************************************************************
 * TaskRenderer
 * This template is the default renderer for tasks and delegates all their
 * contained elements to their respective sub-templates.
 * It also connects outside-handlers with internals.
 * ****************************************************************************/

const handlers = {} // TODO make a Map
const unsaved = new Map()

function hasUnsavedData (itemId, getReceiver) {
  Tracker.autorun(function () {
    unsaved.set(itemId, getReceiver())
  })
}

const allItemsSaved = () => Array.from(unsaved.entries()).every(([key, value]) => value !== true)

function ensureAllSaved (continueCallback) {
  if (allItemsSaved()) {
    return continueCallback()
  }

  confirmDialog({ text: 'task.unsavedItems', type: 'warning' })
    .then(res => {
      if (res) {
        continueCallback()
      }
    })
    .catch(e => console.error(e))
}

const API = Template.taskRenderer.setDependencies({
  contexts: getTaskContexts(),
  language: taskrendererLang
})

Template.taskRenderer.onCreated(function () {
  const instance = this
  instance.state.set('current', 0)
  unsaved.clear()

  const { readMode, preview, data = {} } = instance.data

  const { onItemSubmit, onItemLoad, onTaskPageNext, onTaskPagePrev, onTaskFinished, onLinkPreview } = data
  const hasHandlers = onItemSubmit && onItemLoad

  const isEditable = !readMode && !preview
  const globalPreview = preview || !hasHandlers
  const fallback = () => API.log('preview mode, handlers take no effect')

  handlers.onItemLoad = onItemLoad
  handlers.onItemSubmit = onItemSubmit
  handlers.hasUnsavedData = hasUnsavedData
  handlers.onTaskPageNext = onTaskPageNext || fallback
  handlers.onTaskPagePrev = onTaskPagePrev || fallback
  handlers.onTaskFinished = onTaskFinished || fallback
  handlers.onLinkPreview = onLinkPreview || fallback

  instance.autorun(function () {
    const data = Template.currentData()
    API.log('autorun')
    const { data: task } = data
    const { isComplete } = data


    if (!task) { return }

    check(data.isComplete, Match.Maybe(Boolean))
    check(data.page, Match.Maybe(Number))
    check(task.preview, Match.Maybe(Boolean))
    check(task.print, Match.Maybe(Boolean))
    check(task.pages, [Object])

    const taskId = task._id

    if (typeof data.page === 'number') {
      instance.state.set('current', data.page)
    }

    instance.state.set({
      taskComplete: !!isComplete,
      preview: typeof task.preview === 'boolean' ? task.preview : globalPreview,
      pages: task.pages,
      static: task.header,
      footer: task.footer,
      lessonId: data.lessonId,
      groupId: data.groupId,
      maxPages: task.pages.length,
      loadComplete: true,
      taskId,
      isEditable
    })
  })

  // XXX: this is a workaround to prevent premature rendering
  // due to page changes, which causes the "old" elements being rendered on the "new" page
  // which then causes a cascade of errors, due to false lookups.
  // It works by simply setting a 'pageChanged' flag to true on every page change,
  // which in turn causes the elements to be removed from screen.
  // After a short delay we unset this flag to place the elements on the screen
  // with the new values.
  instance.autorun(() => {
    instance.state.get('current')
    setTimeout(() => instance.state.set('pageChanged', false), 300)
  })
})

Template.taskRenderer.onDestroyed(function () {
  const instance = this
  instance.state.destroy()
  unsaved.clear()
  Object.keys(handlers).forEach(key => delete handlers[key])
})

Template.taskRenderer.helpers({
  loadComplete () {
    if (!API.initComplete()) {
      return
    }

    const instance = Template.instance()
    return instance.state.get('loadComplete')
  },
  state (index) {
    return Template.getState(index)
  },
  all () {
    return Template.getState('pages')
  },
  current () {
    const index = Template.getState('current')
    const pages = Template.getState('pages')
    return pages[index]
  },
  static () {
    const header = Template.getState('static')
    return header && header.content && header.content.length > 0 ? header : null
  },
  footer () {
    const footer = Template.getState('footer')
    return footer && footer.content && footer.content.length > 0 ? footer : null
  },
  currentPage () {
    return Template.getState('current') + 1
  },
  maxPages () {
    return Template.getState('maxPages')
  },
  showProgress () {
    const maxPages = Template.getState('maxPages')
    return maxPages > 1
  },
  hasNext () {
    return Template.getState('current') < Template.getState('maxPages') - 1
  },
  isPreview () {
    return Template.getState('preview')
  },
  hasPrev () {
    return Template.getState('current') > 0
  },
  pageChanged () {
    return Template.getState('pageChanged')
  },
  attributes (element) {
    const instance = Template.instance()
    const preview = instance.state.get('preview')
    const isEditable = instance.state.get('isEditable')
    const { print } = instance.data
    const { isComplete } = instance.data
    const taskId = instance.state.get('taskId')
    const groupId = instance.state.get('groupId')
    const lessonId = instance.state.get('lessonId')
    const page = instance.state.get('current') || instance.data.page || 0

    return Object.assign({}, element, {
      preview,
      isEditable,
      complete: isComplete,
      print,
      page,
      taskId,
      groupId,
      lessonId
    }, {
      onItemLoad: handlers.onItemLoad,
      onItemSubmit: handlers.onItemSubmit,
      onLinkPreview: handlers.onLinkPreview,
      hasUnsavedData: handlers.hasUnsavedData
    })
  },
  taskComplete () {
    return Template.getState('taskComplete')
  },
  perc (current, max) {
    return Math.round(100 * current / (max + 1))
  },
  isPrintPreview () {
    const instance = Template.instance()
    const { preview } = instance.data
    const { print } = instance.data
    return preview && print
  },
  isEditable () {
    return Template.getState('isEditable')
  }
})

Template.taskRenderer.events({

  'click #task-finish-button' (event, templateInstance) {
    event.preventDefault()

    ensureAllSaved(function () {
      const isEditable = templateInstance.state.get('isEditable')
      if (!isEditable) {
        return
      }

      // COLLECT ITEMS
      const taskId = templateInstance.state.get('taskId')
      const pages = templateInstance.state.get('pages')
      const pageIndex = templateInstance.state.get('current')
      const eventObj = {
        page: pageIndex,
        maxPages: pages && pages.length,
        complete: true,
        taskId
      }
      handlers.onTaskPageNext(eventObj)
      handlers.onTaskFinished(eventObj)

      // reset unsaved state on new pages
      unsaved.clear()

      templateInstance.state.set('taskComplete', true)
    })
  },

  'click #task-next-button' (event, templateInstance) {
    event.preventDefault()

    ensureAllSaved(function () {
      const currentPage = templateInstance.state.get('current')
      const newPage = currentPage + 1
      // update data

      const taskId = templateInstance.state.get('taskId')
      const pages = templateInstance.state.get('pages')
      const eventObj = {
        page: newPage,
        maxPages: pages && pages.length,
        complete: true,
        taskId
      }
      handlers.onTaskPageNext(eventObj)

      // reset unsaved state on new pages
      unsaved.clear()

      // update view
      templateInstance.state.set({
        current: newPage,
        pageChanged: true
      })
    })
  },

  'click #task-prev-button' (event, templateInstance) {
    event.preventDefault()

    ensureAllSaved(function () {
      const current = templateInstance.state.get('current')
      const newPage = current - 1
      const isEditable = templateInstance.state.get('isEditable')
      // update data
      if (isEditable) {
        const taskId = templateInstance.state.get('taskId')
        const pages = templateInstance.state.get('pages')
        const eventObj = {
          page: newPage,
          maxPages: pages && pages.length,
          complete: true,
          taskId,
          isEditable
        }
        handlers.onTaskPagePrev(eventObj)
      }

      // reset unsaved state on new pages
      unsaved.clear()

      // Update view
      templateInstance.state.set({
        current: newPage,
        pageChanged: true
      })
    })
  },

  'click #restore-complete' (event, templateInstance) {
    event.preventDefault()

    const taskId = templateInstance.state.get('taskId')
    const current = templateInstance.state.get('current')
    const pages = templateInstance.state.get('pages')
    const isEditable = templateInstance.state.get('isEditable')

    if (isEditable) {
      handlers.onTaskPagePrev({
        page: current,
        maxPages: pages && pages.length,
        complete: false,
        taskId
      })
    }

    templateInstance.state.set('taskComplete', false)
  }
})

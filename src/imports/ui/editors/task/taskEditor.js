/* global $ */
import { Template } from 'meteor/templating'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Router } from '../../../api/routes/Router'
import { Shared } from './helpers/shared'
import { TaskEditorViewStates } from './TaskEditorViewStates'
import { taskEditorSubKey } from './taskEditorSubKey'
import { CurriculumSession } from '../../curriculum/CurriculumSession'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
import { dataTarget } from '../../utils/dataTarget'
import { $in } from '../../../api/utils/query/inSelector'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import { getCollection } from '../../../api/utils/getCollection'
import { setQueryParams } from '../../../api/routes/params/setQueryParams'
import { callMethod } from '../../controllers/document/callMethod'
import { isCurriculumDoc } from '../../../api/decorators/methods/isCurriculumDoc'
import { userIsCurriculum } from '../../../api/accounts/userIsCurriculum'
import taskEditorLanguage from './i18n/taskEditorLanguage'
import '../../layout/submenu/submenu'
import '../../generic/templateLoader/TemplateLoader'
import '../../components/documentState/documentState'
import './taskEditor.scss'
import './taskEditor.html'

/*******************************************************************************
 * The taskEditor Template is a HoC container template to manage basic data
 * loading of
 * - the current task doc
 * - the current unit doc
 * - the current pocket doc
 *
 * and view-state management.
 * It passes the data down to the respective views to let them handle the
 * current task-content editing.
 ******************************************************************************/

const API = Template.taskEditor.setDependencies({
  contexts: [Task, Unit, Pocket],
  language: taskEditorLanguage
})

const views = Object.values(TaskEditorViewStates)

Template.taskEditor.onCreated(function () {
  const instance = this
  instance.state.set('view', 'pages')

  const onError = err => API.fatal(err)

  instance.autorun(() => {
    const tab = getQueryParam('tab')
    if (!tab) return
    const currentView = instance.state.get('view')
    if (currentView !== tab) {
      instance.state.set('view', tab)
    }
  })

  // load unit doc via method, if set by query param
  // since there is no need to track changes for units in this editor

  instance.autorun(() => {
    const unitId = Router.queryParam('unit')

    if (!unitId) {
      instance.state.set('unitDoc', null)
      instance.state.set('unitComplete', true)
      return
    }

    callMethod({
      name: Unit.methods.get,
      args: { _id: unitId },
      failure: API.notify, // not fatal of unit is not loaded
      success: unitDoc => {
        instance.state.set('unitDoc', unitDoc)
        instance.state.set('unitComplete', true)
      }
    })
  })

  // subscribe to the single taskDoc as it changes often

  instance.autorun(() => {
    const taskId = Router.param('taskId')
    if (taskId) {
      instance.state.set('taskId', taskId)
      const taskDocQuery = { _id: $in([taskId]) }
      const taskSubCallback = {
        onReady () {
          const task = getCollection(Task.name).findOne(taskId)

          if (isCurriculumDoc(task)) {
            if (!userIsCurriculum()) {
              return API.fatal(new PermissionDeniedError('errors.notCurriculum', { taskId }))
            }

            CurriculumSession.enable()
          }

          instance.state.set('taskDoc', task)
          instance.state.set('taskComplete', true)
        },
        onError
      }
      API.subscribe({
        key: taskEditorSubKey,
        name: Task.publications.editor.name,
        args: taskDocQuery,
        callbacks: taskSubCallback
      })
    }
  })

  // load pocket but only if we have a unitDoc linked

  instance.autorun(() => {
    const unitDoc = instance.state.get('unitDoc')
    if (!unitDoc) {
      instance.state.set('pocketDoc', null)
      instance.state.set('pocketComplete', true)
      return
    }

    if (unitDoc.pocket !== '__custom__') {
      callMethod({
        name: Pocket.methods.get,
        args: { _id: unitDoc.pocket },
        failure: API.notify,
        success: pocketDoc => {
          instance.state.set('pocketDoc', pocketDoc)
          instance.state.set('pocketComplete', true)
        }
      })
    }
  })
})

Template.taskEditor.onDestroyed(function () {
  API.dispose(taskEditorSubKey)
  this.state.destroy()
})

Template.taskEditor.helpers({
  loadComplete () {
    if (!API.initComplete()) { return }

    const instance = Template.instance()
    return instance.state.get('taskComplete') &&
      instance.state.get('unitComplete') &&
      instance.state.get('pocketComplete')
  },
  submenuData () {
    const instance = Template.instance()
    return {
      views: views,
      queryParam: 'tab',
      getQueryParam: getQueryParam,
      updateQueryParam: setQueryParams,
      onViewSelected: currentViewName => instance.state.set({ currentViewName })
    }
  },
  currentView () {
    const instance = Template.instance()
    const viewName = instance.state.get('currentViewName')
    const view = TaskEditorViewStates[viewName]
    if (!view) return

    const taskDoc = Object.assign({}, instance.state.get('taskDoc'))
    const unitDoc = instance.state.get('unitDoc')
    const pocketDoc = instance.state.get('pocketDoc')

    const templateData = {
      unitDoc,
      taskDoc,
      pocketDoc
    }

    return Object.assign({ templateData }, view)
  },
  getTaskDoc () {
    return Template.getState('taskDoc')
  },
  pocketDoc () {
    return Template.getState('pocketDoc')
  },
  saving () {
    return Shared.cache.get('saving')
  },
  saved () {
    return Shared.cache.get('saved')
  },
  extendedMode () {
    return Template.getState('viewMode') === 'extended'
  },
  unitDoc () {
    return Template.getState('unitDoc')
  },
  unitIcon () {
    return Unit.icon
  }
})

Template.taskEditor.events({
  'change #taskeditor-taskselect' (event, templateInstance) {
    const value = $(event.target).val()
    const task = getCollection(Task.name).findOne(value)
    templateInstance.state.set('taskId', task._id)
  },
  'submit #basicDataForm' (event, templateInstance) {
    event.preventDefault()
    console.warn('remove this?')
  },
  'click .taskeditor-tab-link' (event, templateInstance) {
    event.preventDefault()
    const viewName = dataTarget(event, templateInstance)
    Router.queryParam({ tab: viewName })
  },
  'change .task-editor-viewmode' (event, templateInstance) {
    const val = $(event.currentTarget).val()
    templateInstance.state.set('viewMode', val)
  }
})

Template.taskEditorEditButton.events({
  'click .edit-target-button' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    Shared.cache.set('target', target)
  }
})

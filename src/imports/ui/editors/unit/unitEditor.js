import { Template } from 'meteor/templating'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { UnitEditorViewStates } from './UnitEditorViewStates'
import { DocNotFoundError } from '../../../api/errors/types/DocNotFoundError'
import { unitEditorSubscriptionKey } from './unitEditorSubscriptionKey'
import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'

import { callMethod } from '../../controllers/document/callMethod'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import { setQueryParams } from '../../../api/routes/params/setQueryParams'
import { unitEditorIsMasterMode } from './utils/unitEditorIsMasterMode'
import { userIsCurriculum } from '../../../api/accounts/userIsCurriculum'
import { getCollection } from '../../../api/utils/getCollection'

import unitEditorLanguage from './i18n/unitEditorLanguage'
import '../../layout/submenu/submenu'
import '../../components/confirm/confirm'
import '../../generic/templateLoader/TemplateLoader'
import '../../components/documentState/documentState'
import './unitEditor.html'
import { CurriculumSession } from '../../curriculum/CurriculumSession'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'

const viewStates = Object.values(UnitEditorViewStates)

/*******************************************************************************
 * The unitEditor.js template is an HOC template with mostly container
 * functionality for loading fundamental data for editing.
 *
 * It's purposes are:
 * - subscribe to unit doc
 * - load lesson, class, pocket, original unit
 * - display their titles
 * - display unit info (copy, master, custom)
 * - manage views
 *
 ******************************************************************************/
const API = Template.unitEditor.setDependencies({
  contexts: [Unit],
  language: unitEditorLanguage
})

Template.unitEditor.onCreated(function onUnitEditorCreated () {
  const instance = this

  // ---------------------------------------------------------------------------
  // 1. resetting the state to default values
  // ---------------------------------------------------------------------------

  instance.state.setDefault('currentLoadState', '')
  instance.state.setDefault('unitSubComplete', false)
  instance.state.setDefault('lessonSubComplete', false)
  instance.state.setDefault('pocketSubComplete', false)
  instance.state.setDefault('docNotFound', false)
  instance.state.setDefault('unitId', null)
  instance.state.setDefault('unitDoc', null)
  instance.state.setDefault('lessonDoc', null)
  instance.state.setDefault('loadComplete', false)

  // ---------------------------------------------------------------------------
  // 2. we have to reset everything on a changing unit
  // ---------------------------------------------------------------------------

  instance.autorun(() => {
    const data = Template.currentData()
    const unitId = data.params.unitId
    const existingUnitId = instance.state.get('unitId')

    // reset all internal state settings
    // on a  new unitId
    if (unitId !== existingUnitId) {
      instance.state.clear()
      instance.state.set('unitId', unitId)
    }
  })

  // ---------------------------------------------------------------------------
  // 3. subscribe to the unit doc, since it will change very often
  // ---------------------------------------------------------------------------

  instance.autorun(() => {
    const unitId = instance.state.get('unitId')
    if (!unitId) return

    API.subscribe({
      key: unitEditorSubscriptionKey,
      name: Unit.publications.editor.name,
      args: { unitId },
      callbacks: {
        onReady () {
          const unitDoc = getCollection(Unit.name).findOne(unitId)

          // check for master-access here (but make sure it's also checked on
          // the server, in methods,s publications, etc

          if (unitEditorIsMasterMode(unitDoc)) {
            if (!userIsCurriculum()) {
              return API.fatal(new PermissionDeniedError('errors.notCurriculum', { unitId }))
            }

            CurriculumSession.enable()
          }

          if (unitDoc) {
            instance.state.set('unitDoc', unitDoc)
            instance.state.set('unitSubComplete', true)
          }
          else {
            instance.state.set('docNotFound', true)
            API.fatal(new DocNotFoundError(Unit.name, { unitId }))
          }
        }
      }
    })
  })

  // ---------------------------------------------------------------------------
  // 4. get class and lesson
  //
  // if this unit is linked with a certain class, lesson and pocket, then
  // load these documents, but don't subscribe, since they won't change
  // during usage of this editor.
  // ---------------------------------------------------------------------------

  instance.autorun(() => {
    const unitId = instance.state.get('unitId')
    if (!unitId) return

    callMethod({
      name: Unit.methods.getEditorDocs.name,
      args: { unitId },
      failure: er => API.fatal(er),
      success: ({ lessonDoc, classDoc, pocketDoc, originalUnitDoc }) => {
        const dependenciesComplete = true

        // if we have a lessonDoc associated (non-curriculum modes)
        // then we can't continue if the lesson is already running or completed
        if (lessonDoc && (LessonStates.isRunning(lessonDoc) || LessonStates.isCompleted(lessonDoc))) {
          return API.fatal(new PermissionDeniedError('editor.unit.errors.invalidLessonState', { lessonDoc }))
        }

        instance.state.set({
          lessonDoc,
          classDoc,
          originalUnitDoc,
          pocketDoc,
          dependenciesComplete
        })
      }
    })
  })
})

Template.unitEditor.onDestroyed(function () {
  API.dispose(unitEditorSubscriptionKey)
  this.state.destroy()
})

Template.unitEditor.helpers({
  loadComplete () {
    if (!API.initComplete()) {
      return false
    }
    const instance = Template.instance()
    return instance.state.get('unitSubComplete') &&
      instance.state.get('dependenciesComplete')
  },
  unitDoc () {
    Template.getState('originalUnitDoc')
    return Template.getState('unitDoc')
  },
  submenuData () {
    const instance = Template.instance()
    return {
      views: viewStates,
      queryParam: 'tab',
      getQueryParam: getQueryParam,
      updateQueryParam: setQueryParams,
      onViewSelected: function (currentViewName) {
        instance.state.set({ currentViewName })
      }
    }
  },
  currentView () {
    const instance = Template.instance()
    const viewName = instance.state.get('currentViewName')
    const view = UnitEditorViewStates[viewName]
    if (!view) return

    const unitDoc = instance.state.get('unitDoc')
    const lessonDoc = instance.state.get('lessonDoc')
    const pocketDoc = instance.state.get('pocketDoc')
    const classDoc = instance.state.get('classDoc')
    const originalUnitDoc = instance.state.get('originalUnitDoc')
    const templateData = {
      unitDoc,
      lessonDoc,
      pocketDoc,
      classDoc,
      originalUnitDoc
    }

    return Object.assign({ templateData }, view)
  },
  originalUnit () {
    return Template.getState('originalUnitDoc')
  },
  lessonDoc () {
    return Template.getState('lessonDoc')
  },
  classDoc () {
    return Template.getState('classDoc')
  }
})

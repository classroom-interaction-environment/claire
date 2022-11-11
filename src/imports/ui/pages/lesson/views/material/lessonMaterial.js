import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { ReactiveVar } from 'meteor/reactive-var'
import { i18n } from '../../../../../api/language/language'
import { LessonActions } from '../../../../controllers/LessonActions'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'
import { Material } from '../../../../../contexts/material/Material'
import { Beamer } from '../../../../../contexts/beamer/Beamer'
import { Task } from '../../../../../contexts/curriculum/curriculum/task/Task'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { TaskResults } from '../../../../../contexts/tasks/results/TaskResults'
import { dataTarget } from '../../../../utils/dataTarget'
import { printHTMLElement } from '../../../../utils/printHtmlElement'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { delayedCallback } from '../../../../utils/delayedCallback'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { getCollection } from '../../../../../api/utils/getCollection'
import { resolveMaterialReference } from '../../../../../contexts/material/resolveMaterialReference'
import { callMethod } from '../../../../controllers/document/callMethod'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import '../../../../renderer/phase/full/phaseFullRenderer'
import '../../../../renderer/phase/compact/compactPhases'
import '../../../../renderer/phase/nonphaseMaterial/nonPhaseMaterial'
import '../progress/taskProgress'
import './lessonMaterial.scss'
import './lessonMaterial.html'
import { lessonSubKey } from '../../lessonSubKey'

const API = Template.lessonMaterial.setDependencies({
  contexts: getMaterialContexts().concat([TaskResults]),
  initMaterial: true
})

Template.lessonMaterial.onCreated(function () {
  const instance = this
  instance.state.set('hasGroups', {})
  instance.state.set('updating', {})
  instance.state.set('downloading', {})
  instance.state.set('showResults', {})
  instance.currentItems = new ReactiveVar()

  instance.updating = function (key, value) {
    const updating = instance.state.get('updating')
    updating[key] = value
    instance.state.set('updating', updating)
  }

  instance.isUpdating = function (key) {
    const updating = instance.state.get('updating')
    return updating[key]
  }

  instance.downloading = function (key, value) {
    const downloading = instance.state.get('downloading')
    downloading[key] = value
    instance.state.set('downloading', downloading)
  }

  instance.isDownloading = function (key) {
    const downloading = instance.state.get('downloading')
    return downloading[key]
  }

  const lessonId = instance.data.lessonDoc._id
  instance.autorun(() => {
    const hasGroups = {}
    getCollection(Group.name).find({ lessonId }).forEach(groupDoc => {
      if (groupDoc.phases?.length) {
        groupDoc.phases.forEach(phaseId => {
          hasGroups[phaseId] = true
        })
      }

      else {
        hasGroups.global = true
      }
    })
    instance.state.set({ hasGroups })
  })

  // ==========================================================================
  // RESOLVE REFERENCES
  // ==========================================================================

  // we want to resolve references only once, so we get all material refs
  // and add them by id to a dict, which we then can use to access by id

  instance.references = new ReactiveDict()
  const addReference = reference => {
    if (!instance.references.get(reference.document)) {
      const refDoc = resolveMaterialReference(reference)
      if (!refDoc) {
        console.warn('could not resolve', reference.document)
      }
      instance.references.set(reference.document, refDoc)
    }
  }

  instance.autorun(() => {
    const data = Template.currentData()
    const { unitDoc, unassociatedMaterial } = data
    const allRefs = new Map()
    const addToMap = ref => allRefs.set(ref.document, ref)

    ;(unitDoc.phases || []).forEach(phase => {
      if (phase.references?.length) {
        phase.references.forEach(addToMap)
      }
    })

    ;(unassociatedMaterial || []).forEach(addToMap)

    if (allRefs.size === 0) {
      return
    }

    allRefs.forEach(ref => addReference(ref))
  })
})

Template.lessonMaterial.helpers({
  unassociatedMaterial () {
    return Template.instance().data.unassociatedMaterial
  },
  hasGroups (phaseId) {
    return Template.getState('hasGroups')[phaseId]
  },
  groups (phaseId) {
    if (phaseId === 'global') {
      return
    }
    return getCollection(Group.name).find({ phases: phaseId })
  },
  isActiveStudent (referenceId, groupMaterial) {
    if (groupMaterial && groupMaterial.some(m => m._id === referenceId)) {
      return true
    }

    const { lessonDoc } = Template.instance().data
    return lessonDoc &&
      lessonDoc.visibleStudent &&
      lessonDoc.visibleStudent.find(ref => ref._id === referenceId)
  },
  lessonId () {
    const { lessonDoc } = Template.instance().data
    return lessonDoc._id
  },
  lessonPhases () {
    const { unitDoc } = Template.instance().data
    return unitDoc.phases
  },
  resolvedReference (refId) {
    return Template.instance().references.get(refId)
  },
  isIdle () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.isIdle(lessonDoc)
  },
  canStart () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.canStart(lessonDoc)
  },
  isRunning () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.isRunning(lessonDoc)
  },
  isComplete () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.isCompleted(lessonDoc)
  },
  canComplete () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.canComplete(lessonDoc)
  },
  updating (phaseId, referenceId) {
    return Template.instance().isUpdating(referenceId)
  },
  downloading (phaseId, referenceId) {
    return Template.instance().isDownloading(referenceId)
  },
  isNotIdle () {
    const { lessonDoc } = Template.instance().data
    return (LessonStates.isRunning(lessonDoc) || LessonStates.isCompleted(lessonDoc))
  },
  previewBeamerTarget () {
    return Template.getState('previewTarget')
  },
  previewData () {
    const templateInstance = Template.instance()
    const previewData = templateInstance.state.get('previewData')
    const materialDoc = templateInstance.state.get('previewTarget')

    if (!materialDoc || !previewData) return

    const options = {}
    options.print = !!templateInstance.state.get('print')

    // we need to assign the data in the helper, because
    // passing this to a ReactiveDict will destroy any
    // function, that is part of the data, which in turn will
    // break the functionality of the material, if it relies
    // on certain functions, such as onItemLoad etc.
    // XXX: maybe we can instead use a ReactiveVar?
    previewData.data = LessonMaterial.getPreviewData({ materialDoc, templateInstance, options })
    return previewData
  },
  previewPhases () {
    const instance = Template.instance()
    const isPreview = instance.state.get('previewPhases')
    const { unitDoc } = instance.data
    if (!isPreview || !unitDoc) return

    return unitDoc.phases
  },
  unitDoc () {
    const { unitDoc } = Template.instance().data
    return unitDoc
  },
  printing () {
    return Template.getState('printing')
  },
  toggleTitle (id) {
    const { lessonDoc } = Template.instance().data
    if (!lessonDoc) return
    return lessonDoc.visibleStudent && lessonDoc.visibleStudent.indexOf(id) > -1
      ? i18n.get('lesson.actions.toggleMobileActive')
      : i18n.get('lesson.actions.toggleMobileInactive')
  },
  resultButtonDisabled (refType) {
    const { lessonDoc } = Template.instance().data
    if (!lessonDoc || LessonStates.isIdle(lessonDoc)) return true
    return refType !== Task.name
  },
  presentButtonDisabled (refType) {
    return !Beamer.actions.get()
  },
  downloadButtonDisabled (refType) {
    const ctx = Material.get(refType)
    const downloadable = ctx.material?.downloadable
    return downloadable !== true
  },
  showResults (referenceId, groupId) {
    const states = Template.getState('showResults')
    let showId = referenceId
    if (typeof groupId === 'string') {
      showId += groupId
    }
    return states && states[showId]
  },
  currentItems () {
    return Template.instance().currentItems.get()
  },
  currentTaskDoc () {
    return Template.getState('currentTaskDoc')
  },
  defaultResponseProcessor (item) {
    return item.responseProcessors[0].name
  },
  currentResponseProcessor (item) {
    const { itemId } = item
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc) return

    const beamerReference = beamerDoc.references.find(r => r.itemId === itemId)
    if (beamerReference?.responseProcessor) {
      return item.responseProcessors.find(rp => rp.name === beamerReference.responseProcessor)
    }

    const templateRp = Template.getState(itemId)
    if (templateRp) {
      return item.responseProcessors.find(rp => rp.name === templateRp)
    }

    return item.responseProcessors?.[0]
  },
  isOnBeamer (referenceId, itemId) {
    const { lessonDoc } = Template.instance().data
    const lessonId = lessonDoc && lessonDoc._id
    return lessonId && Beamer.doc.has({ referenceId, lessonId, itemId })
  },
  sendingToBeamer (referenceId, itemId) {
    const sendingToBeamerDoc = Template.instance().state.get('sendingToBeamer')
    if (!sendingToBeamerDoc) return false
    if (typeof referenceId === 'string' && sendingToBeamerDoc.referenceId !== referenceId) return false
    if (typeof itemId === 'string' && sendingToBeamerDoc.itemId !== itemId) return false
    return true
  }
})

Template.lessonMaterial.events({
  // ===========================================================================
  //
  //  START LESSON
  //
  // ===========================================================================
  'click .start-lesson-button' (event, templateInstance) {
    event.preventDefault()
    confirmDialog({ text: 'lesson.actions.startConfirm' })
      .then(result => {
        if (!result) return
        const { lessonDoc } = templateInstance.data
        LessonActions.start({
          _id: lessonDoc._id,
          failure: API.notify,
          success: () => API.notify(true)
        })
      })
      .catch(e => API.notify(e))
  },

  // ===========================================================================
  //
  //  COMPLETE LESSON
  //
  // ===========================================================================
  'click .complete-lesson-button' (event, templateInstance) {
    event.preventDefault()
    confirmDialog({ text: 'lesson.actions.completeConfirm' })
      .then(result => {
        if (!result) return
        const { lessonDoc } = templateInstance.data
        LessonActions.complete({
          _id: lessonDoc._id,
          failure: API.notify,
          success: () => API.notify(true)
        })
      })
      .catch(e => API.notify(e))
  },

  // ===========================================================================
  //
  //  TOGGLE MATERIAL
  //
  // ===========================================================================
  'click .toggle-mobile-button' (event, templateInstance) {
    event.preventDefault()
    const referenceId = dataTarget(event, templateInstance, 'reference')
    templateInstance.updating(referenceId, true)

    const groupId = dataTarget(event, templateInstance, 'group')
    const groupDoc = groupId && getCollection(Group.name).findOne(groupId)
    const context = dataTarget(event, templateInstance, 'type')
    const { lessonDoc } = templateInstance.data
    const { _id } = lessonDoc

    if (groupDoc) {
      const visibleInPhases = (lessonDoc.visibleStudent || []).some(ref => ref._id === referenceId)

      // toggle only for group
      if (!visibleInPhases) {
        callMethod({
          name: Group.methods.toggleMaterial,
          args: { _id: groupId, materialId: referenceId, contextName: context },
          receive: () => templateInstance.updating(referenceId, false),
          failure: API.notify
        })
      }

      else {
        return templateInstance.updating(referenceId, false)
      }
    }

    // if no groupDoc is present we toggle the material for the phases-level
    else {
      LessonActions.toggle({ _id, referenceId, context }, (err) => {
        if (err) {
          API.notify(err)
        }
        setTimeout(() => templateInstance.updating(referenceId, false), 100)
      })
    }
  },

  // ===========================================================================
  //
  //  PREVIEW MATERIAL
  //
  // ===========================================================================
  'click .preview-material-button' (event, templateInstance) {
    event.preventDefault()
    const context = dataTarget(event, templateInstance, 'type')
    const referenceId = dataTarget(event, templateInstance, 'reference')

    templateInstance.$('#lesson-material-preview-modal').modal('show')

    LessonMaterial.loadPreviewTemplate({
      name: context,
      referenceId
    }, templateInstance)
      .catch(e => API.API.notify(e))
      .then(() => {
        const previewDoc = { name: context, referenceId }
        const template = LessonMaterial.getPreviewTemplate(previewDoc)

        templateInstance.state.set({
          previewTarget: previewDoc,
          previewData: { template }
        })
      })
  },

  // ===========================================================================
  //
  //  CLEAR PREVIEW
  //
  // ===========================================================================
  'hidden.bs.modal #lesson-material-preview-modal' (event, templateInstance) {
    templateInstance.state.set({
      previewTarget: null,
      previewData: null
    })
  },

  // ===========================================================================
  //
  //  PRINT MATERIAL FROM PREVIEW
  //
  // ===========================================================================
  'click .print-material-preview-button' (event, templateInstance) {
    event.preventDefault()
    printHTMLElement('preview-material-target')
  },

  // ===========================================================================
  //
  //  DOWNLOAD MATERIAL
  //
  // ===========================================================================
  'click .material-download-button' (event, templateInstance) {
    event.preventDefault()
    const context = dataTarget(event, templateInstance, 'type')
    const referenceId = dataTarget(event, templateInstance, 'reference')
    templateInstance.downloading(referenceId, true)
    if (context === Task.name) {
      templateInstance.state.set('previewTarget', {
        referenceId,
        name: context,
        print: true
      })
      setTimeout(() => {
        templateInstance.downloading(referenceId, false)
        printHTMLElement('preview-material-target', () => {
          templateInstance.state.set('printMaterial', false)
        })
      }, 500)
    }
    else {

    }
  },

  // ===========================================================================
  //
  //  SHOW PHASES SCHEMA
  //
  // ===========================================================================
  'click .preview-all-phases-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('previewPhases', true)
    templateInstance.$('#lesson-material-preview-phases-modal').modal('show')
  },
  'click .print-phases-table-button' (event, templateInstance) {
    event.preventDefault()
    const printRoot = dataTarget(event, templateInstance)
    printHTMLElement(printRoot, () => {
    }, err => {
      API.API.notify(err)
    })
  },

  // ===========================================================================
  //
  //  SHOW TASK RESULTS
  //
  // ===========================================================================
  'click .lesson-show-results-button': async (event, templateInstance) => {
    event.preventDefault()

    const taskId = dataTarget(event, templateInstance, 'reference')
    const groupId = dataTarget(event, templateInstance, 'group') || ''
    const groupDoc = groupId && getCollection(Group.name).findOne(groupId)
    const classDoc = templateInstance.data.classDoc
    const lessonId = templateInstance.data.lessonDoc._id

    let showId = taskId
    if (groupId) showId += groupId

    const showResults = templateInstance.state.get('showResults')

    // when already active -> hide
    if (showResults[showId]) {
      delete showResults[showId]
      // check if there is any progress to be shown left
      // and if not, unsubscribe from results
      const isActive = Object.values(showResults).some(val => !!val)
      if (!isActive) {
        API.unsubscribe(TaskResults.publications.byTask.name)
      }
      return templateInstance.state.set({ currentTaskId: null, showResults })
    }

    API.subscribe({
      name: TaskResults.publications.byTask,
      args: { lessonId },
      key: lessonSubKey,
      callbacks: {
        onError: API.notify,
        onReady: () => console.debug('results ready', getCollection(TaskResults.name).find().fetch())
      }
    })

    const taskDoc = getLocalCollection(Task.name).findOne(taskId)
    const userIds = groupDoc
      ? groupDoc.users.map(doc => doc.userId)
      : classDoc.students
    showResults[showId] = { taskDoc, userIds, lessonId, taskId }

    import('./taskResultTable/taskResultTable')
      .catch(API.notify)
      .then(() => templateInstance.state.set({ currentTaskId: taskId, showResults }))
  },

  // ===========================================================================
  //
  //  TOGGLE BEAMER
  //
  // ===========================================================================
  'hidden.bs.modal #lesson-beamer-preview-modal' (event, templateInstance) {
    templateInstance.state.set({
      currentTaskId: null,
      currentTaskDoc: null
    })
  },
  'click .toggle-beamer-material-button' (event, templateInstance) {
    event.preventDefault()
    const context = dataTarget(event, templateInstance, 'context')
    const itemId = dataTarget(event, templateInstance, 'item')
    const referenceId = dataTarget(event, templateInstance, 'reference')
    const defaultRp = dataTarget(event, templateInstance, 'defaultrp')
    const responseProcessor = templateInstance.state.get(itemId) || defaultRp

    // if we have a Task document, we need to open the preview dialog
    // TODO do not couple with task but with a material flag
    if (!itemId && context === Task.name) {
      return import('../../../../renderer/item/list/itemList')
        .catch(API.notify)
        .then(() => {
          const taskDoc = Material.getDocuments(Task.name, { _id: referenceId })[0]

          // TODO change to beamerData { taskDoc }
          templateInstance.state.set({
            currentTaskId: referenceId,
            currentTaskDoc: taskDoc
          })

          API.showModal('lesson-beamer-preview-modal')
        })
    }

    templateInstance.state.set('sendingToBeamer', { referenceId, itemId })

    const { lessonDoc } = templateInstance.data
    const lessonId = lessonDoc._id

    Beamer.doc.material({
      lessonId,
      referenceId,
      context,
      itemId,
      responseProcessor
    }, delayedCallback(300, (err, res) => {
      templateInstance.state.set('sendingToBeamer', null)
      if (err) return API.notify(err)
    }))
  },
  'click .select-item-rp-button' (event, templateInstance) {
    event.preventDefault()

    const itemId = dataTarget(event, templateInstance, 'item')
    const name = dataTarget(event, templateInstance, 'rp')
    const beamerDoc = Beamer.doc.get()

    // if we have this item currently displayed and it has a defined RP
    // then we only want to update the response processor on the reference
    if (beamerDoc && beamerDoc.references) {
      const index = beamerDoc.references.findIndex(r => r.itemId === itemId)
      const beamerReference = beamerDoc.references[index]

      // only update the beamer doc, if the referenced item is active
      if (beamerReference && beamerReference.responseProcessor !== name) {
        const updateDoc = { _id: beamerDoc._id, references: beamerDoc.references }
        updateDoc.references[index].responseProcessor = name
        Beamer.doc.update(updateDoc, (err) => {
          if (err) return API.API.notify(err)
        })
      }
    }

    // in any case let the template know that this is the current rp
    // so it is used immediately when the rp is activated
    templateInstance.state.set(itemId, name)
  }
})

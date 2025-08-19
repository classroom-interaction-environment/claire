import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'

import { LessonMaterial } from '../../controllers/LessonMaterial'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'

import { dataTarget } from '../../utils/dataTarget'
import { $in } from '../../../api/utils/query/inSelector'
import { createMaterialId } from '../../../api/material/createMaterialId'

import { TaskDefinitions } from '../../../contexts/tasks/definitions/TaskDefinitions'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { Item } from '../../../contexts/tasks/definitions/items/Item'
import { ResponseProcessorLoader } from '../../../contexts/tasks/responseProcessors/ResponseProcessorLoader'
import { ResponseProcessorAPI } from '../../../api/response/ResponseProcessorAPI'
import { Users } from '../../../contexts/system/accounts/users/User'
import { Task } from '../../../contexts/curriculum/curriculum/task/Task'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { Files } from '../../../contexts/files/Files'
import { ReactiveSet } from '../../../api/utils/reactive/ReactiveSet'
import { getResponseProcessors } from '../../../api/response/getResponseProcessors'
import { getFileType } from '../../../api/files/getFileType'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { getMaterialContexts } from '../../../contexts/material/initMaterial'

import '../../components/invitation/coderender/coderenderer'
import '../../generic/tooltip/tooltip'
import './present.html'
import { getCollection } from '../../../api/utils/getCollection'

const API = Template.present.setDependencies({
  contexts: getMaterialContexts().concat([Unit, Lesson, Task, TaskResults]),
  initMaterial: true,
  debug: true
})

// init loaders and registries
const taskInit = TaskDefinitions.initialize()
const rpInit = ResponseProcessorLoader.initialize()

Template.present.onCreated(function () {
  const instance = this
  instance.state.setDefault('references', [])
  instance.allUsers = new ReactiveSet()

  // ----------------------------------------------------------------------------
  // check if beamer is complete
  // ----------------------------------------------------------------------------
  instance.autorun(() => {
    if (!Meteor.userId()) return

    const beamerDoc = Beamer.doc.get()

    if (beamerDoc) {
      instance.state.set('beamerComplete', true)
    }
  })

  // ----------------------------------------------------------------------------
  // load all related lessons
  // ----------------------------------------------------------------------------
  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc) return

    // context, lessonId, referenceId, itemId
    const { references } = beamerDoc

    if (!references) return

    const lessonIds = new Set()
    const referencedLessons = new Set()

    references.forEach(ref => {
      if (getLocalCollection(Lesson.name).find(ref.lessonId).count() === 0) {
        lessonIds.add(ref.lessonId)
      }
      referencedLessons.add(ref.lessonId)
    })

    if (lessonIds.size === 0) {
      return instance.state.set({ lessonIds: [...referencedLessons], lessonsComplete: true })
    }

    loadIntoCollection({
      name: Lesson.methods.my,
      args: { ids: [...lessonIds] },
      failure: API.fatal,
      collection: getLocalCollection(Lesson.name),
      success: () => instance.state.set({ lessonIds: [...referencedLessons], lessonsComplete: true })
    })
  })

  // ----------------------------------------------------------------------------
  // subscribe to all items
  // ----------------------------------------------------------------------------
  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    if (!Item.isInitialized() || !API.initComplete() || !beamerDoc) return

    // context, lessonId, referenceId, itemId
    const { references } = beamerDoc
    if (!references) return

    instance.state.set('itemsComplete', false)

    const itemRefsForSub = references
      .filter(ref => ref.itemId)
      .map(ref => {
        return {
          lessonId: ref.lessonId,
          taskId: ref.referenceId,
          itemId: ref.itemId
        }
      })

    if (itemRefsForSub.length === 0) {
      return instance.state.set('itemsComplete', true)
    }

    API.subscribe({
      name: TaskResults.publications.allByItem,
      key: 'beamerSubKey',
      args: { references: itemRefsForSub },
      callbacks: {
        onError: API.notify,
        onReady: () => {
          console.debug(getCollection(TaskResults).find().fetch())
          instance.state.set('itemsComplete', true)
        }
      }
    })
  })

  // ----------------------------------------------------------------------------
  // load all associated units
  // ----------------------------------------------------------------------------
  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    const lessonDocComplete = instance.state.get('lessonsComplete')
    if (!beamerDoc || !lessonDocComplete) return

    const lessonIds = instance.state.get('lessonIds') || []
    const unitIds = new Set()

    getLocalCollection(Lesson.name).find({ _id: $in(lessonIds) }).forEach(lessonDoc => {
      if (getLocalCollection(Unit.name).find(lessonDoc.unit).count() === 0) {
        unitIds.add(lessonDoc.unit)
      }
    })

    if (unitIds.size === 0) {
      return instance.state.set('unitsComplete', true)
    }

    loadIntoCollection({
      name: Unit.methods.all,
      args: { ids: [...unitIds] },
      failure: API.fatal,
      collection: getLocalCollection(Unit.name),
      success: () => instance.state.set('unitsComplete', true)
    })
  })

  // ----------------------------------------------------------------------------
  // load all associated references into local collections
  // ----------------------------------------------------------------------------
  instance.autorun(async () => {
    const beamerDoc = Beamer.doc.get()

    if (!beamerDoc?.references?.length) {
      // prevent infinite loading by setting references loaded to true
      return instance.state.set('referenceDocsLoaded', true)
    }

    // set to false to trigger next autorun, when this is complete
    instance.state.set('referenceDocsLoaded', false)

    const allCtxDocs = {}
    beamerDoc.references.forEach(({ context, referenceId }) => {
      if (!allCtxDocs[context]) {
        allCtxDocs[context] = new Set()
      }
      allCtxDocs[context].add(referenceId)
    })

    for (const [context, docIds] of Object.entries(allCtxDocs)) {
      const ctx = ContextRegistry.get(context)
      API.log('load material docs', context, docIds)
      await loadIntoCollection({
        name: ctx.methods.all,
        args: { ids: [...docIds] },
        collection: getLocalCollection(context),
        failure: API.notify
      })
    }

    instance.state.set('referenceDocsLoaded', true)
  })

  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    const referenceDocsLoaded = instance.state.get('referenceDocsLoaded')

    if (!referenceDocsLoaded || !beamerDoc || !Item.isInitialized() || !Files.isInitialized() || !rpInit.get()) {
      return API.debug('resolving references not ready yet')
    }

    API.debug('start resolving material references')
    const resolvedReferences = beamerDoc.references.map(ref => {
      const document = getLocalCollection(ref.context).findOne(ref.referenceId)

      if (!document) {
        return console.warn('Found no document for ref', ref)
      }

      if (ref.itemId) {
        const item = Item.extract(ref.itemId, document)
        item.dataType = item.dataType || Item.getDataTypeBy(item.meta)

        const availableResponseProcessors = getResponseProcessors({
          dataType: item.dataType,
          fileType: getFileType(item.fileType)
        })
        ref.item = item

        // we only provide these as options if there is more than 1 available
        ref.availableResponseProcessors = availableResponseProcessors?.length > 1
          ? availableResponseProcessors
          : undefined
      }

      ref.document = document
      return ref
    })

    instance.state.set({
      resolvedReferences: resolvedReferences,
      materialComplete: true
    })
  })

  // ----------------------------------------------------------------------------
  // load and cache associated items and their result renderer
  // ----------------------------------------------------------------------------
  const cachedRefs = new Map()

  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    const resolvedReferences = instance.state.get('resolvedReferences')
    const itemsComplete = instance.state.get('itemsComplete')
    const initialized = taskInit.get()

    if (!Item.isInitialized() || !beamerDoc || !initialized || !resolvedReferences || !itemsComplete) return

    cachedRefs.forEach(cacheId => {
      if (!resolvedReferences.find(r => r.itemId === cacheId)) {
        cachedRefs.delete(cacheId)
      }
    })

    // iterate all references, that are currently active on the beamer
    // and find those relevant to be resolved regarding their response processors
    // Add them to the queue to be loaded in a Promise
    const referenceQueue = []
    resolvedReferences.forEach(ref => {
      const materialDoc = { name: ref.context }

      // load any remaining preview templates
      LessonMaterial.loadPreviewTemplate(materialDoc, instance)
        .catch(e => API.notify(e))
        .then(() => {
          API.debug('preview template loaded for ', ref.context)
          instance.state.set(ref.context, true)
        })

      // skip all non-task references here
      if (!ref.context === Task.name || !ref.itemId) {
        return false
      }

      //
      // item response processors
      //

      // caching references enables us to skip this expensive operations
      // for example when beamer layout or background changes but also
      // in case we add a new ref and want to skip already initialized refs
      if (cachedRefs.has(ref.itemId)) {
        const cached = cachedRefs.get(ref.itemId)
        if (cached.responseProcessor && cached.responseProcessor === ref.responseProcessor) {
          return false
        }
      }

      // TaskDoc = ref.document
      // search in the task doc for the current item and skip, if possible
      const { itemId } = ref
      ref.document.pages.some(page => {
        if (!page.content) return false

        const entry = page.content.find(entry => entry.itemId === itemId)

        if (entry) {
          referenceQueue.push({ ref, entry })
          return true
        }

        return false
      })
    })

    Promise.all(referenceQueue.map(async obj => {
      const { entry: item, ref } = obj
      const { lessonId, referenceId: taskId, itemId, responseProcessor } = ref

      // we can define a responseProcessor on a reference, for example, if
      // teacher wishes to display the result in a specific way.
      // Otherwise we will use whatever fallback fits the current situation most
      item.responseProcessor = responseProcessor

      const responseProcessorData = await ResponseProcessorLoader.loadAll({
        item,
        lessonId,
        taskId,
        itemId
      })

      // extract user ids from responses and add them to the reactive set
      // in order to subscribe to their usernames
      responseProcessorData.data.results.forEach(doc => instance.allUsers.add(doc.createdBy))
      instance.state.set(itemId, responseProcessorData)

      // return itemId for caching
      return { itemId, responseProcessor }
    }))
      .catch(e => API.notify(e))
      .then(resolvedRefs => {
        resolvedRefs.forEach(({ itemId, responseProcessor }) => cachedRefs.set(itemId, { responseProcessor }))
      })
  })

  instance.autorun(() => {
    const allUsers = instance.allUsers.all()
    if (allUsers.length === 0) return

    API.subscribe({
      name: Users.publications.present,
      args: { userIds: allUsers },
      key: 'beamerSubKey',
      callbacks: {
        onError: API.notify,
        onReady: () => instance.state.set('usersReady', true)
      }
    })
  })
})

Template.present.onRendered(function () {
  const instance = this

  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc) return
    const bgRef = beamerDoc && beamerDoc.ui.background
    const colorState = bgRef
      ? Beamer.ui.backgroundColors[bgRef]
      : Beamer.ui.backgroundColors.light

    const $main = global.$('.main-beamer-container')
    if (instance.bgCache || instance.tcCache) {
      $main.removeClass(instance.bgCache)
      $main.removeClass(instance.tcCache)
    }
    instance.bgCache = `bg-${colorState.className}`
    instance.tcCache = `text-${colorState.text}`
    $main.addClass(instance.bgCache)
    $main.addClass(instance.tcCache)
  })
})

Template.present.helpers({
  loadComplete () {
    const taskInitialized = taskInit.get()
    const rpInitialized = rpInit.get()

    if (!taskInitialized || !rpInitialized) { return false }

    const instance = Template.instance()
    const beamerComplete = instance.state.get('beamerComplete')
    const lessonsComplete = instance.state.get('lessonsComplete')
    const materialComplete = instance.state.get('materialComplete')

    return beamerComplete &&
      lessonsComplete &&
      materialComplete
    // instance.state.get('itemsComplete')
  },
  background () {
    return Beamer.doc.background()
  },
  colClass () {
    const layout = Beamer.doc.grid()
    return layout && layout.colClass
  },
  rowClass () {
    const layout = Beamer.doc.grid()
    return layout && layout.rowClass
  },
  beamerDoc () {
    return Beamer.doc.get()
  },
  codeDoc () {
    return Template.getState('codeDoc')
  },
  resolvedReferences () {
    return Template.instance().state.get('resolvedReferences')
  },
  customActions ({ lessonId, referenceId, itemId }) {
    if (!rpInit.get()) { return }
    const key = createMaterialId(lessonId, referenceId, itemId)
    return ResponseProcessorAPI.getActions(key)
  },
  itemContext (itemId) {
    if (!itemId) return
    const itemDoc = Template.getState(itemId)
    return itemDoc && Item.get(itemDoc.meta)
  },
  canHaveResponseProcessors (doc) {
    return doc.context === Task.name
  },
  responseProcessorLoaded (itemId) {
    return itemId && Template.getState(itemId)
  },
  responseProcessor ({ itemId, document, referenceId, lessonId, context }) {
    if (!rpInit.get()) { return }
    const instance = Template.instance()
    const rp = instance.state.get(itemId)
    if (!rp) return

    // Also, api is cached, so it's safe to create here
    rp.data.api = rp.data.api || ResponseProcessorAPI.create(rp.data, instance)

    return rp
  },
  getItem (itemId) {
    return itemId && Template.getState(itemId)
  },
  previewTemplate ({ context }) {
    return Template.getState(context) && LessonMaterial.getPreviewTemplate({ name: context })
  },
  previewTemplateData ({ context, referenceId }) {
    const instance = Template.instance()
    return LessonMaterial.getPreviewData({
      materialDoc: { referenceId, name: context },
      templateInstance: instance,
      options: { print: false }
    })
  },
  codeUrl (code) {
    const url = Meteor.absoluteUrl(code)
    return url.replace(/.*:\/\//, '')
  },
  unloading (reference) {
    const { lessonId, referenceId, itemId } = reference
    const contentId = createMaterialId(lessonId, referenceId, itemId)
    return Template.getState('unloading') === contentId
  },
  availableResponseProcessors (ref) {
    return ref?.availableResponseProcessors
  }
})

Template.present.events({
  'click .remove-code-button' (event) {
    event.preventDefault()
    Beamer.doc.code(null)
  },
  'click .remove-reference-button' (event, templateInstance) {
    event.preventDefault()
    const context = dataTarget(event, templateInstance, 'context')
    const lessonId = dataTarget(event, templateInstance, 'lesson')
    const itemId = dataTarget(event, templateInstance, 'item')
    const referenceId = dataTarget(event, templateInstance, 'reference')

    const contentId = createMaterialId(lessonId, referenceId, itemId)
    templateInstance.state.set('unloading', contentId)

    Beamer.doc.material({
      referenceId,
      context,
      lessonId,
      itemId
    }, (err) => {
      if (err) return API.notify(err)
      templateInstance.state.set('unloading', null)
    })
  },

  // we allow renderers to define custom top-level actions (like edit, save)
  // and we aggregate all their events in this handler, then finding
  // the appropriate handler from the saved actions data and call it
  // data atts schema:
  //     data-id=action.id
  //     data-index=@index
  //     data-lesson=reference.lessonId
  //     data-context=reference.context
  //     data-reference=reference.referenceId
  //     data-item=reference.itemId
  'click .custom-action-button' (event, templateInstance) {
    const id = dataTarget(event, templateInstance, 'id')
    const lessonId = dataTarget(event, templateInstance, 'lesson')
    const referenceId = dataTarget(event, templateInstance, 'reference')
    const itemId = dataTarget(event, templateInstance, 'item')

    const actionId = createMaterialId(lessonId, referenceId, itemId)
    ResponseProcessorAPI.callAction(actionId, id, event, templateInstance)
  },
  // we allow users to change the
  'click .select-rp-button' (event, templateInstance) {
    event.preventDefault()

    const itemId = dataTarget(event, templateInstance, 'item')
    const responseProcessor = dataTarget(event, templateInstance, 'rp')
    const beamerDoc = Beamer.doc.get()
    const index = beamerDoc.references.findIndex(material => material.itemId === itemId)

    if (index === -1) {
      return API.notify(new Error('errors.notFound'))
    }

    const updateDoc = { _id: beamerDoc._id, references: beamerDoc.references }
    updateDoc.references[index].responseProcessor = responseProcessor

    Beamer.doc.update(updateDoc, (err) => {
      if (err) return API.notify(err)
    })
  }
})

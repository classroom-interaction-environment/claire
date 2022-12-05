import { Template } from 'meteor/templating'
import { check } from 'meteor/check'
import { ReactiveVar } from 'meteor/reactive-var'
import { Random } from 'meteor/random'
import { TaskDefinitions } from '../../../../contexts/tasks/definitions/TaskDefinitions'
import { Schema } from '../../../../api/schema/Schema'
import { Task } from '../../../../contexts/curriculum/curriculum/task/Task'
import { Shared } from '../helpers/shared'
import { Files } from '../../../../contexts/files/Files'

import { formIsValid, formReset } from '../../../components/forms/formUtils'
import { dataTarget } from '../../../utils/dataTarget'
import { getCollection } from '../../../../api/utils/getCollection'
import { confirmDialog } from '../../../components/confirm/confirm'
import { updateContextDoc } from '../../../controllers/document/updateContextDoc'
import { ensureTaskPageContentIntegrity } from '../helpers/ensureTaskPageContentIntegrity'
import Sortable from 'sortablejs'

import { removeContextDoc } from '../../../controllers/document/removeContextDoc'
import { isCurriculumDoc } from '../../../../api/decorators/methods/isCurriculumDoc'
import { userIsCurriculum } from '../../../../api/accounts/userIsCurriculum'
import { callMethod } from '../../../controllers/document/callMethod'
import { getTaskContexts } from '../../../../contexts/tasks/getTaskContexts'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'
import { asyncTimeout } from '../../../../api/utils/asyncTimeout'
import { getMaterialRenderer } from '../../../../api/material/getMaterialRenderer'

import './pageContent.scss'
import './pageContent.html'

const API = Template.taskPageContent.setDependencies({
  contexts: getTaskContexts()
})

const tasksInitialized = TaskDefinitions.initialize()
const filesInitialized = Files.initialize()
const itemsInitialized = new ReactiveVar(true)

// TODO make it a Map
const SchemaCache = {
  values: {},
  set (content, meta, schema) {
    check(content, String)
    check(meta, String)
    if (!this.values[content]) {
      this.values[content] = {}
    }
    this.values[content][meta] = schema
  },
  get (content, meta) {
    check(content, String)
    check(meta, String)
    if (!this.values[content]) {
      return null
    }
    return this.values[content][meta]
  }
}

const getCurrentContent = ({ task, currentIndex, header, footer }) => {
  if (header) return task?.header?.content
  if (footer) return task?.footer?.content

  const content = task?.pages?.[currentIndex]?.content
  if (!content) { return content }

  return content.filter(element => {
    return TaskDefinitions.helpers.isRegistered(element)
  })
}

Template.taskPageContent.onCreated(function () {
  const instance = this
  instance.state.setDefault('addContent', false)
  instance.state.setDefault('addContentIndex', -1)
  instance.state.setDefault('addMeta', false)
  instance.state.setDefault('applyReady', false)
  instance.state.setDefault('contentType', null)
  instance.state.setDefault('contentMeta', null)
  instance.state.setDefault('showSchemas', {})
  instance.state.setDefault('contentType', null)
  instance.state.setDefault('editContentType', null)
  instance.state.setDefault('editContentType', null)
  instance.state.setDefault('currentIndex', -1)
  instance.state.setDefault('currentContent', null)
  instance.state.setDefault('header', null)
  instance.state.setDefault('footer', null)
  instance.state.setDefault('loadComplete', false)

  instance.autorun(function () {
    if (!tasksInitialized.get() || !itemsInitialized.get() || !filesInitialized.get()) {
      return // skip until loaded
    }
    const data = Template.currentData()
    const { currentIndex } = data
    const { task } = data
    const { header } = data
    const { footer } = data

    ensureTaskPageContentIntegrity(task, currentIndex)
    const currentContent = getCurrentContent({
      task,
      currentIndex,
      header,
      footer
    })

    instance.state.set({
      task: task,
      header: header,
      footer: footer,
      currentIndex: currentIndex,
      currentContent: null,
      loadComplete: true
    })

    setTimeout(() => instance.state.set('currentContent', currentContent))
  })
})

Template.taskPageContent.onRendered(function onTemplateRendered () {
  const instance = this
  instance.autorun(c => {
    const complete = instance.state.get('loadComplete')
    const task = instance.state.get('task')

    if (
      !tasksInitialized.get() ||
      !itemsInitialized.get() ||
      !complete || !task ||
      instance._sortableCreated) {
      return
    }

    const sortableRoot = document.querySelector('.sortable-root')
    Sortable.create(sortableRoot, {
      handle: '.task-content-move-entry-cursor',
      animation: 150,
      direction: 'vertical',
      ghostClass: 'bg-primary', // 'task-content-sortable-ghost',
      forceFallback: true, // TODO find a way without this
      swapThreshold: 1,
      onStart: function () {
        instance.state.set('dragging', true)
      },
      onEnd: function (/* evt */) {
        const indices = []

        instance.$('.task-content-move-entry-cursor').each(function () {
          indices.push(instance.$(this).data('index'))
        })

        // let's check if our content hasn't changed and if so, skip the update

        const content = instance.state.get('currentContent')
        const sortedPageContent = indices.map(index => content[index])

        if (JSON.stringify(sortedPageContent) === JSON.stringify(content)) {
          return // no indices have changed
        }

        // then determine, which target layout we are actually sorting

        const header = instance.state.get('header')
        const footer = instance.state.get('footer')
        const isBody = !header && !footer
        const currentPageIndex = instance.state.get('currentIndex')

        let contentKey

        if (header) contentKey = 'header.content'
        if (footer) contentKey = 'footer.content'
        if (isBody) contentKey = `pages.${currentPageIndex}.content`

        setTimeout(() => updateContextDoc({
          context: Task,
          _id: task._id,
          doc: {
            title: task.title,
            [contentKey]: sortedPageContent
          },
          failure: er => API.notify(er),
          success: () => {
            instance.state.set('dragging', false)
            API.notify('form.updateComplete')
          }
        }), 50)
      }
    })

    instance._sortableCreated = true
    c.stop()
  })

  instance.autorun(() => {
    const leftTemplate = instance.state.get('leftTemplate')
    if (!leftTemplate) return
    const selectedTargetIndex = instance.state.get('selectedTargetIndex')
    if (typeof selectedTargetIndex !== 'undefined' && selectedTargetIndex > -1) {
      setTimeout(() => {
        const $target = instance.$('.selected-pagecontent-element')
        if ($target && $target.get(0)) {
          $target.get(0).scrollIntoView({ behavior: 'smooth' })
        }
      }, 150)
    }
    instance.state.set('leftTemplate', false)
  })
})

Template.taskPageContent.helpers({
  loadComplete () {
    if (!tasksInitialized.get()) return
    if (!itemsInitialized.get()) return
    if (!filesInitialized.get()) return

    return Template.getState('loadComplete')
  },
  pageIndices (index) {
    const values = []
    const pages = Template.getState('task')?.pages
    if (!pages) return values

    for (let i = 0; i < pages.length; i++) {
      values.push({
        value: i,
        label: i + 1,
        target: index
      })
    }

    return values
  },
  samePage (index) {
    return Template.getState('currentIndex') === index
  },
  showSchema (index) {
    const schowSchemas = Template.getState('showSchemas')
    return schowSchemas[index]
  },
  printSchema (obj) {
    return JSON.stringify(obj, null, 2)
  },
  entries () {
    return Template.getState('currentContent')
  },
  getIndex (targetId) {
    const currentContent = Template.getState('currentContent') || []
    const index = currentContent.findIndex(({ id }) => id === targetId)
    return index + 1
  },
  notFirst (index) {
    return index > 0
  },
  notLast (index, entries) {
    return index && entries && index < entries.length - 1
  },
  hasAttributes (entry) {
    return Object.keys(entry).length > 2
  },
  editAttributes (targetId) {
    return targetId && Template.getState('editAttributes') === targetId
  },
  /// /////////////////////////////////////////////////////////
  attributesSchema (contentType, metaType) {
    let schemaInstance = SchemaCache.get(contentType, metaType)
    if (schemaInstance) {
      return schemaInstance
    }

    const taskId = Template.instance().data.task._id
    const schemaDef = TaskDefinitions.helpers.schema(contentType, metaType, { taskId })

    schemaInstance = Schema.create(schemaDef)
    SchemaCache.set(contentType, metaType, schemaInstance)
    return schemaInstance
  },
  attributesDoc (contentObject) {
    API.log(contentObject)
    const instance = Template.instance()
    const header = instance.state.get('header')
    const footer = instance.state.get('footer')

    if (header) {
      return Object.assign({}, contentObject, { preview: true })
    }

    if (footer) {
      return Object.assign({}, contentObject, { preview: true })
    }

    if (contentObject && Object.keys(contentObject).length > 2) {
      return Object.assign({}, contentObject, { preview: true })
    }

    return null
  },
  previewDoc (doc, context) {
    return Object.assign({}, doc, {
      meta: context,
      preview: true
    })
  },
  hasCollection (contextName) {
    return getCollection(contextName)
  },
  taskRendererTemplate () {
    return 'loading'
  },
  addingContent (index) {
    return Template.getState('addContentIndex') === index
  },
  addContentCategory () {
    const category = Template.getState('addContentCategory')
    const contentTypes = TaskDefinitions.helpers.contentTypes()
    return contentTypes && contentTypes.find(entry => entry.value === category)
  },
  canBeMadePersistent (attributesDoc = {}) {
    const collection = getCollection(attributesDoc.meta)
    return collection && !collection.findOne(attributesDoc.itemId)
  },
  moveDisabled (index) {
    const instance = Template.instance()
    const task = instance.state.get('task')
    if (!task || task.pages.length < 2) {
      return true
    }
    const targetIndex = instance.state.get('hoverTargetIndex')
    return targetIndex !== index
  },
  hideAddContent () {
    const instance = Template.instance()
    return instance.state.get('dragging') || instance.state.get('editAttributes')
  },
  isSelected (targetId) {
    return targetId && Template.getState('selectedTargetIndex') === targetId
  },
  isHovered (targetId) {
    return targetId && Template.getState('hoverTargetIndex') === targetId
  },
  editDisabled (entry) {
    if (!entry || !entry.id) {
      return true
    }

    const targetId = entry.id
    const isHovered = Template.getState('hoverTargetIndex') === targetId

    return !isHovered || (entry.type === 'Files')
  },
  isPassive (targetId) {
    const editAttributes = Template.getState('editAttributes')
    return editAttributes && editAttributes !== targetId
  },
  newElement (content, meta) {
    const newElementState = Template.getState('newElement')
    return newElementState && newElementState.content === content && newElementState.meta === meta
  },
  newElementFormState () {
    return Template.getState('newElement')
  },
  loadingElementForm () {
    return Template.getState('loadingElementForm')
  },
  contentButtonType (type) {
    return type === 'item' ? 'outline-info' : 'outline-success'
  },
  submitting (value) {
    if (value) {
      return Template.getState('submitting') === value
    }
    return Template.getState('submitting')
  },
  editTarget () {
    return Template.getState('editTarget')
  },
  editPreview () {
    return Template.getState('editPreview')
  }
})

Template.taskPageContent.events({
  /// ///////////////////////////////////////////////////////////////
  // OVER / ACTIVE
  /// ///////////////////////////////////////////////////////////////
  'mouseenter/mousedown/tap .pagecontent-edit-target' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    templateInstance.state.set('hoverTargetIndex', targetId)
  },
  'mousedown .pagecontent-edit-target' (event, templateInstance) {
    const targetId = dataTarget(event, templateInstance)
    templateInstance.state.set('selectedTargetIndex', targetId)
  },
  /// ///////////////////////////////////////////////////////////////
  // ADD NEW CONTENT
  /// ///////////////////////////////////////////////////////////////
  'click .add-content-entry' (event, templateInstance) {
    event.preventDefault()
    const rawIndex = dataTarget(event, templateInstance, 'index')
    const context = dataTarget(event, templateInstance)
    let index = typeof rawIndex !== 'undefined'
      ? parseInt(rawIndex, 10)
      : -1

    // if the index is lower than zero,
    // then we convert it to be "the last element index"
    if (index === -1) {
      const currentContent = templateInstance.state.get('currentContent') || []
      index = currentContent.length
    }

    templateInstance.state.set('addContentIndex', index)
    templateInstance.state.set('addContentCategory', context)
    API.showModal('pageContentAddModal')
  },
  'click .select-new-element-button': async (event, templateInstance) => {
    event.preventDefault()
    const hasElement = templateInstance.state.get('newElement')
    templateInstance.state.set({
      newElement: null,
      loadingElementForm: true
    })

    // let it render load indicator if we have
    // switched between element subtypes
    if (hasElement) {
      await asyncTimeout(300)
    }

    const $target = templateInstance.$(event.currentTarget)
    const content = $target.data('content')
    const meta = $target.data('meta')
    const category = TaskDefinitions.helpers.getMeta(content)
    const elementDef = category.get(meta)

    // TODO move away from here, use a pattern, that sticks this form-loading to TaskDefinitions
    if (typeof elementDef.form === 'function') {
      await elementDef.form()
    }

    // TODO same for this one, we have no definite method for this case yet
    if (elementDef.isFilesCollection) {
      const renderer = getMaterialRenderer(elementDef.material)
      await renderer.load()
    }

    templateInstance.state.set({
      newElement: { content, meta },
      loadingElementForm: false
    })

    let $form
    let count = 0
    const security = 100

    while (!$form && count++ < security) {
      $form = templateInstance.$('#newElementForm').get(0)
      await asyncTimeout(25)
    }

    if ($form) {
      $form.scrollIntoView({ behavior: 'smooth' })
      const selector = $form.querySelector('*[autofocus]')
      if (selector) { selector.focus() }
    }
  },
  'click .cancel-new-element-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('newElement', null)
  },
  'submit #newElementForm' (event, templateInstance) {
    event.preventDefault()
    const newElement = templateInstance.state.get('newElement')
    const contentType = newElement.content
    const contentMeta = newElement.meta
    const schema = SchemaCache.get(contentType, contentMeta)
    const insertDoc = formIsValid(schema, 'newElementForm')
    if (!insertDoc) {
      return
    }

    const task = templateInstance.state.get('task')
    const currentPageIndex = templateInstance.state.get('currentIndex')
    const addContextIndex = templateInstance.state.get('addContentIndex')

    const newContent = Object.assign({
      id: Random.id(4),
      type: contentType,
      meta: contentMeta
    }, insertDoc)

    const editHead = templateInstance.state.get('header')
    const editFoot = templateInstance.state.get('footer')
    const editPage = !editHead && !editFoot

    ensureTaskPageContentIntegrity(task, currentPageIndex)

    let updateDoc

    if (editHead) {
      if (addContextIndex === -1) {
        task.header.content.push(newContent)
      }
      else {
        task.header.content.splice(addContextIndex, 0, newContent)
      }
      updateDoc = { header: task.header }
    }

    if (editFoot) {
      if (addContextIndex === -1) {
        task.footer.content.push(newContent)
      }
      else {
        task.footer.content.splice(addContextIndex, 0, newContent)
      }
      updateDoc = { footer: task.footer }
    }

    if (editPage) {
      const currentPage = task.pages[currentPageIndex]
      if (addContextIndex === -1) {
        currentPage.content.push(newContent)
      }
      else {
        currentPage.content.splice(addContextIndex, 0, newContent)
      }
      task.pages[currentPageIndex] = currentPage
      updateDoc = { [`pages.${currentPageIndex}`]: currentPage }
    }

    updateContextDoc({
      context: Task,
      _id: task._id,
      doc: updateDoc,
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => {
        API.hideModal('pageContentAddModal')
        templateInstance.state.set('submitting', false)
        templateInstance.state.set('newElement', null)
        templateInstance.state.set('addContentIndex', -1)
        templateInstance.state.set('addContentCategory', null)
        API.notify('form.insertComplete')
      }
    })

    if (newContent.type === Files.name && Files.has(newContent.meta) && isCurriculumDoc(task) && userIsCurriculum()) {
      const filesContext = Files.get(newContent.meta)
      callMethod({
        name: filesContext.methods.setMasterState.name,
        args: { _id: newContent._id, value: true },
        failure: err => API.notify(err)
      })
    }
  },
  'hidden.bs.modal #pageContentAddModal' (event, templateInstance) {
    templateInstance.state.set('addContent', false)
    templateInstance.state.set('addContentIndex', -1)
    templateInstance.state.set('newElement', null)
    templateInstance.state.set('addContentCategory', null)
    formReset('newElementForm')
  },
  'change .select-content-type' (event, templateInstance) {
    event.preventDefault()
    const contentType = templateInstance.$(event.currentTarget).val()
    templateInstance.state.set('contentType', contentType)
    templateInstance.state.set('addMeta', !!contentType)
  },

  'click .addContent-cancel-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('addContent', false)
    templateInstance.state.set('addContentIndex', -1)
  },

  'change .select-content-meta-type' (event, templateInstance) {
    event.preventDefault()
    const contentMeta = templateInstance.$(event.currentTarget).val()
    templateInstance.state.set('contentMeta', contentMeta)
    templateInstance.state.set('applyReady', !!contentMeta)
  },
  /// ///////////////////////////////////////////////////////////////
  // EDIT ATTRIBUTES
  /// ///////////////////////////////////////////////////////////////
  'hidden.bs.modal #pageContentEditModal' (event, templateInstance) {
    templateInstance.state.set('editTarget', null)
    templateInstance.state.set('editAttributes', null)
    templateInstance.state.set('editPreview', null)
    formReset('attributesForm')
  },
  'click .edit-attributes': async (event, templateInstance) => {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const currentContent = templateInstance.state.get('currentContent')
    const editTarget = currentContent.find(({ id }) => id === targetId)

    // TODO move away from here, use a pattern, that sticks this form-loading to TaskDefinitions
    const category = TaskDefinitions.helpers.getMeta(editTarget.type)
    const elementDef = category.get(editTarget.meta)
    if (typeof elementDef.form === 'function') {
      await elementDef.form()
    }

    templateInstance.state.set('editTarget', editTarget)
    templateInstance.state.set('editPreview', editTarget)
    templateInstance.state.set('editAttributes', targetId)
    templateInstance.$('#pageContentEditModal').modal('show')
  },
  'click .preview-attributes-form-button' (event, templateInstance) {
    templateInstance.state.set('submitting', true)

    const insertDoc = AutoForm.getFormValues('attributesForm').insertDoc
    if (!insertDoc) {
      return templateInstance.state.set('editPreview', null)
    }

    const editTarget = templateInstance.state.get('editTarget')
    const editPreview = Object.assign({}, editTarget, insertDoc)
    templateInstance.state.set('editPreview', editPreview)

    setTimeout(() => {
      templateInstance.state.set('submitting', null)
    }, 300)
  },
  'click .save-attributes-form-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#attributesForm').submit()
  },
  'submit #attributesForm' (event, templateInstance) {
    event.preventDefault()

    const task = templateInstance.state.get('task')
    const pageIndex = templateInstance.state.get('currentIndex')
    const editTarget = templateInstance.state.get('editAttributes')
    const page = (task?.pages?.[pageIndex]) || { content: [] }

    const editHead = templateInstance.state.get('header')
    const editFoot = templateInstance.state.get('footer')
    const editPage = !editHead && !editFoot

    const currentContent = templateInstance.state.get('currentContent')
    const contentIndex = currentContent.findIndex(({ id }) => id === editTarget)

    ensureTaskPageContentIntegrity(task, contentIndex)

    const insertDoc = AutoForm.getFormValues('attributesForm').insertDoc
    if (!insertDoc) return

    let updateDoc = {}

    if (editHead) {
      const staticContentElement = currentContent[contentIndex]
      task.header.content[contentIndex] = Object.assign({}, {
        id: staticContentElement.id,
        type: staticContentElement.type,
        meta: staticContentElement.meta
      }, insertDoc)

      updateDoc = {
        [`header.content.${contentIndex}`]: task.header.content[contentIndex]
      }
    }

    if (editFoot) {
      const staticContentElement = currentContent[contentIndex]
      task.footer.content[contentIndex] = Object.assign({}, {
        id: staticContentElement.id,
        type: staticContentElement.type,
        meta: staticContentElement.meta
      }, insertDoc)

      updateDoc = {
        [`footer.content.${contentIndex}`]: task.footer.content[contentIndex]
      }
    }

    if (editPage) {
      // on page content we assign assign the content to
      // the current page and the current page to the pages
      const oldContent = currentContent[contentIndex]
      page.content[contentIndex] = Object.assign({}, {
        id: oldContent.id,
        type: oldContent.type,
        meta: oldContent.meta
      }, insertDoc)

      task.pages[pageIndex] = page

      updateDoc = {
        [`pages.${pageIndex}.content.${contentIndex}`]: task.pages[pageIndex].content[contentIndex]
      }
    }

    updateContextDoc({
      context: Task,
      _id: task._id,
      doc: updateDoc,
      prepare: () => templateInstance.state.set('submitting', true),
      receive: () => templateInstance.state.set('submitting', false),
      failure: er => API.notify(er),
      success: () => {
        templateInstance.$('#pageContentEditModal').modal('hide')
        API.notify('form.updateComplete')
      }
    })
  },
  'click .page-content-code' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const index = parseInt($target.data('target'), 10)
    const showSchemas = templateInstance.state.get('showSchemas')
    showSchemas[index] = !showSchemas[index]
    templateInstance.state.set('showSchemas', showSchemas)
  },
  /// ///////////////////////////////////////////////////////////////
  // UP / DOWN / DELETE
  /// ///////////////////////////////////////////////////////////////
  'click .page-content-delete' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const byTargetId = ({ id }) => id === targetId

    const task = templateInstance.state.get('task')
    const pageIndex = templateInstance.state.get('currentIndex')

    const editHead = templateInstance.state.get('header')
    const editFoot = templateInstance.state.get('footer')
    const editPage = !editHead && !editFoot
    const text = 'task.confirmDeleteElement'

    ensureTaskPageContentIntegrity(task, pageIndex)

    confirmDialog({ text })
      .then(result => {
        if (!result) return

        let updateDoc
        let contentIndex
        let contentElement

        if (editHead) {
          contentIndex = task.header.content.findIndex(byTargetId)
          contentElement = task.header.content[contentIndex]
          task.header.content.splice(contentIndex, 1)
          updateDoc = { header: task.header }
        }

        if (editFoot) {
          contentIndex = task.footer.content.findIndex(byTargetId)
          contentElement = task.footer.content[contentIndex]
          task.footer.content.splice(contentIndex, 1)
          updateDoc = { footer: task.footer }
        }

        if (editPage) {
          const page = task.pages[pageIndex]
          contentIndex = page.content.findIndex(byTargetId)
          contentElement = page.content[contentIndex]
          page.content.splice(contentIndex, 1)
          task.pages[pageIndex] = page
          updateDoc = { [`pages.${pageIndex}`]: page }
        }

        // linked files need to be handled carefully:
        // 1. files may be linked to an _original so we can't remove them
        //    and we even may have not permission here to do so and even
        //    if we have permission we would f*ck up things if we delete it
        // 2. the image may have been selected from uploaded images from the unit
        //    or another unit so we either can't remove it
        // 3. only remove the image if it was sole part of this task and nothing
        //    else so we can safely delete if from the server

        if (contentElement.type === Files.name && Files.has(contentElement.meta)) {
          const filesDoc = getLocalCollection(contentElement.meta).findOne(contentElement._id)

          // if the files doc could not be found we try to remove it anyway
          const linkedTask = filesDoc && filesDoc.meta.taskId

          if (linkedTask === task._original) {
            API.log('skip removing doc, because it is part of _original')
          }
          else if (!filesDoc || linkedTask === task.id) {
            removeContextDoc({
              context: Files.get(contentElement.meta),
              _id: contentElement._id,
              prepare: () => templateInstance.state.set('submitting', contentIndex),
              failure: er => API.notify(er),
              success: () => API.notify('file.deleted')
            })
          }
          else {
            API.log('skip removing doc as it has an unknown task linked:', linkedTask)
          }
        }

        updateContextDoc({
          context: Task,
          _id: task._id,
          doc: updateDoc,
          prepare: () => templateInstance.state.set('submitting', contentIndex),
          receive: () => templateInstance.state.set('submitting', false),
          failure: er => API.notify(er),
          success: () => API.notify('form.updateComplete')
        })
      })
      .catch(e => API.notify(e))
  },
  'click .page-content-move' (event, templateInstance) {
    event.preventDefault()

    const target = templateInstance.$(event.currentTarget)
    const task = templateInstance.state.get('task')
    const currentPageIndex = templateInstance.state.get('currentIndex')
    const targetPageIndex = parseInt(target.data('page'), 10)
    const currentContentIndex = parseInt(target.data('target'), 10)

    const header = templateInstance.state.get('header')
    const footer = templateInstance.state.get('footer')
    // const editPage = !header && !footer

    ensureTaskPageContentIntegrity(task, currentPageIndex)

    let updateDoc

    let tempContent
    if (header) {
      tempContent = task.header.content[currentContentIndex]
      task.pages[targetPageIndex].content.push(tempContent)
      task.header.content.splice(currentContentIndex, 1)

      updateDoc = {
        header: task.header,
        [`pages.${targetPageIndex}.content`]: task.pages[targetPageIndex].content
      }
    }
    else if (footer) {
      tempContent = task.footer.content[currentContentIndex]
      task.pages[targetPageIndex].content.push(tempContent)
      task.footer.content.splice(currentContentIndex, 1)
      updateDoc = {
        footer: task.footer,
        [`pages.${targetPageIndex}.content`]: task.pages[targetPageIndex].content
      }
    }
    else {
      tempContent = task.pages[currentPageIndex].content[currentContentIndex]
      task.pages[targetPageIndex].content.push(tempContent)
      task.pages[currentPageIndex].content.splice(currentContentIndex, 1)
      updateDoc = {
        [`pages.${targetPageIndex}.content`]: task.pages[targetPageIndex].content,
        [`pages.${currentPageIndex}.content`]: task.pages[currentPageIndex].content
      }
    }

    updateContextDoc({
      context: Task,
      _id: task._id,
      doc: updateDoc,
      failure: er => API.notify(er),
      success: () => {
        API.notify()
        Shared.updatePage(targetPageIndex, task.pages[targetPageIndex])
      }
    })
  },
  'click .select-existing-element' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const index = $target.data('index')
    const content = $target.data('content')
    const context = $target.data('meta')
    templateInstance.state.set('selectExistingElement', {
      index,
      content,
      context
    })
    templateInstance.$('#selectExistingModal').modal('show')
  },
  'hidden.bs.modal' (event, templateInstance) {
    event.preventDefault()
    setTimeout(() => {
      templateInstance.state.set('selectExistingElement', null)
    }, 50)
  }
})

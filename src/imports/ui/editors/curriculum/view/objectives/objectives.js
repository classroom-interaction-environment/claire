import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Objective } from '../../../../../contexts/curriculum/curriculum/objective/Objective'
import { curriculumEditorSubKey } from '../../curriculumEditorSubKey'
import { cursor } from '../../../../../api/utils/cursor'
import { dataTarget } from '../../../../utils/dataTarget'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { formReset } from '../../../../components/forms/formUtils'
import { removeContextDoc } from '../../../../controllers/document/removeContextDoc'
import { sleep } from '../../../../../api/utils/sleep'
import { iife } from '../../../../../api/utils/iife'
import { insertUpdateCurriculumForm } from '../../insertUpdateCurriculumForm'
import { getCollection } from '../../../../../api/utils/getCollection'
import './objectives.scss'
import './objectives.html'

const expanded = new ReactiveDict()
const toDocId = doc => doc._id
const getAllChildren = (parent) => {
  const out = new Set()
  const children = getCollection(Objective.name).find({ parent }).map(toDocId)

  children.forEach(docId => {
    out.add(docId)
    getAllChildren(docId).forEach(_id => out.add(_id))
  })

  // edge case, if there was an undefined entry
  out.delete(undefined)

  return Array.from(out)
}

const API = Template.curriculumObjectives.setDependencies({
  contexts: [Objective],
})

const objectiveSchema = API.createSchema(Objective.schema, { withDefault: true })

Template.curriculumObjectives.onCreated(function () {
  const instance = this
  instance.objectives = new Mongo.Collection(null)

  API.subscribe({
    key: curriculumEditorSubKey,
    name: Objective.publications.curriculum.name,
    callbacks: {
      onError: API.notify,
      onReady: () => instance.state.set('loadComplete', true)
    }
  })
})

Template.curriculumObjectives.onDestroyed(function () {
  expanded.clear()
})

Template.curriculumObjectives.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  updating (id) {
    return Template.getState('updating') === id
  },
  newDoc () {
    return Template.getState('newDoc')
  },
  editDoc () {
    return Template.getState('editDoc')
  },
  objectiveSchema () {
    return objectiveSchema
  }
})

Template.curriculumObjectives.events({
  'click .create-objective-button' (event, templateInstance) {
    event.preventDefault()
    formReset('editObjectiveForm')
    templateInstance.$('#curriculumObjectivesModal').modal('show')
  },
  'click .add-child-button' (event, templateInstance) {
    event.preventDefault()
    const parent = dataTarget(event, templateInstance)
    templateInstance.state.set({
      newDoc: { parent }
    })
    templateInstance.$('#curriculumObjectivesModal').modal('show')
  },
  'click .edit-child-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const document = getCollection(Objective.name).findOne(targetId)

    API.ensureDocument(document, targetId)
    templateInstance.state.set({ editDoc: document })
    API.showModal('curriculumObjectivesModal')
  },
  'click .delete-child-button' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const document = getCollection(Objective.name).findOne(docId)
    const allChildren = getAllChildren(docId)
    const count = allChildren.length
    const children = allChildren
      .map(_id => {
        const doc = getCollection(Objective.name).findOne(_id)
        return `${doc.index} - ${doc.title}`
      })
      .join('\n')

    API.ensureDocument(document)
    const { title } = document

    const text = 'editor.didactics.objectives.confirmDelete'
    const textOptions = { title, children, count }

    confirmDialog({ text, textOptions, codeRequired: true, type: 'danger' })
      .catch(API.notify)
      .then(res => {
        if (!res) return

        allChildren.reverse()
        allChildren.push(docId)

        iife(async function remove () {
          for (const _id of allChildren) {
            await removeContextDoc({
              context: Objective,
              _id: _id,
              prepare: () => templateInstance.state.set('deleting', _id),
              receive: () => templateInstance.state.set('deleting', null),
              failure: API.notify,
              success: API.notify(true)
            })
            await sleep(500)
          }
        })
      })
  },
  'hidden.bs.modal' (event, templateInstance) {
    formReset('editObjectiveForm')
    templateInstance.state.set({
      editDoc: null,
      newDoc: null
    })
  },
  'click .expand-all-button' (event, templateInstance) {
    event.preventDefault()
    const all = getCollection(Objective.name).find().fetch()
    const allExpanded = templateInstance.state.get('allExpanded')
    all.forEach(objectiveDoc => {
      expanded.set(objectiveDoc._id, !allExpanded)
    })
    templateInstance.state.set('allExpanded', !allExpanded)
  },
  'submit #editObjectiveForm' (event, templateInstance) {
    event.preventDefault()

    insertUpdateCurriculumForm({
      context: Objective,
      schema: objectiveSchema,
      editDocName: 'editDoc',
      updateName: 'updating',
      formName: 'editObjectiveForm',
      modalName: '#curriculumObjectivesModal',
      API: API,
      templateInstance
    })
  }
})

Template.deObjective.helpers({
  children (docId) {
    return cursor(() => getCollection(Objective.name).find({ parent: docId }, { sort: { index: 1 } }))
  },
  isExpanded (id) {
    return expanded.get(id)
  },
  childCount (parentId) {
    return getCollection(Objective.name).find({ parent: parentId }).count()
  },
})

Template.deObjective.events({
  'click .expand-toggle-button' (event, templateInstance) {
    event.preventDefault()
    event.stopPropagation()
    const targetId = dataTarget(event, templateInstance)
    const isExpanded = expanded.get(targetId)
    expanded.set(targetId, !isExpanded)
  }
})

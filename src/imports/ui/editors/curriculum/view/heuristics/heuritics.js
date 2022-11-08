import { Template } from 'meteor/templating'
import { DimensionType } from '../../../../../contexts/curriculum/curriculum/types/DimensionType'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { curriculumEditorSubKey } from '../../curriculumEditorSubKey'
import { formReset } from '../../../../components/forms/formUtils'
import { dataTarget } from '../../../../utils/dataTarget'
import { cursor } from '../../../../../api/utils/cursor'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { removeContextDoc } from '../../../../controllers/document/removeContextDoc'
import { insertUpdateCurriculumForm } from '../../insertUpdateCurriculumForm'
import { getCollection } from '../../../../../api/utils/getCollection'
import '../../../../renderer/dimension/dimension'
import './heuristics.html'

const API = Template.curriculumHeuristics.setDependencies({
  contexts: [Dimension]
})

const dimensionSchema = API.createSchema(Dimension.schema)

/**
 * This Template allows to edit the heuristic's dimensions.
 */

Template.curriculumHeuristics.onCreated(function () {
  const instance = this

  formReset('editDimensionForm')

  API.subscribe({
    key: curriculumEditorSubKey,
    name: Dimension.publications.curriculum.name,
    callbacks: {
      onError: API.notify,
      onReady: instance.state.set('loadComplete', true)
    }
  })
})

Template.curriculumHeuristics.helpers({
  dimensionSchema () {
    return dimensionSchema
  },
  loadComplete () {
    return Template.getState('loadComplete')
  },
  entries (type) {
    return cursor(() => getCollection(Dimension.name).find({ type }))
  },
  dimensionTypes () {
    return DimensionType.toArr()
  },
  edit (dimensionId) {
    return dimensionId && Template.getState('edit') === dimensionId
  },
  updating (id) {
    return Template.getState('updating') === id
  },
  deleting (id) {
    return Template.getState('deleting') === id
  },
  showForm () {
    return Template.getState('showForm')
  }
})

Template.curriculumHeuristics.events({
  'hidden.bs.modal' (event, templateInstance) {
    templateInstance.state.set('showForm', false)
  },
  'click .create-dimension-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('showForm', true)
    templateInstance.$('#curriculumHeuristicsModal').modal('show')
  },
  'click .edit-dimension-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set('showForm', true)
    const dimensionId = dataTarget(event, templateInstance)
    templateInstance.state.set('edit', dimensionId)
  },
  'click .delete-dimension-button' (event, templateInstance) {
    event.preventDefault()
    const docId = dataTarget(event, templateInstance)
    const dimensionDoc = getCollection(Dimension.name).findOne(docId)
    const { title } = dimensionDoc

    const text = 'editor.didactics.heuristics.confirmDelete'
    const textOptions = { title }

    confirmDialog({ text, textOptions, codeRequired: true, type: 'danger' })
      .catch(API.notify)
      .then(res => {
        if (!res) return

        removeContextDoc({
          context: Dimension,
          _id: docId,
          prepare: () => templateInstance.state.set('deleting', docId),
          receive: () => templateInstance.state.set('deleting', null),
          failure: API.notify,
          success: () => API.notify(true)
        })
      })
  },
  'submit #editDimensionForm' (event, templateInstance) {
    event.preventDefault()

    const editId = templateInstance.state.get('edit')
    const editDoc = getCollection(Dimension.name).findOne(editId)
    templateInstance.state.set({ editDoc })

    insertUpdateCurriculumForm({
      context: Dimension,
      schema: dimensionSchema,
      editDocName: 'editDoc',
      updateName: 'updating',
      formName: 'editDimensionForm',
      modalName: '#curriculumHeuristicsModal',
      templateInstance,
      API,
      onSuccess: () => templateInstance.state.set('edit', null)
    })
  }
})

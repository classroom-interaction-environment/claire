import { Template } from 'meteor/templating'
import { ReactiveDict } from 'meteor/reactive-dict'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { curriculumEditorSubKey } from '../../curriculumEditorSubKey'
import { cursor } from '../../../../../api/utils/cursor'
import { formReset } from '../../../../components/forms/formUtils'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { dataTarget } from '../../../../utils/dataTarget'
import { sleep } from '../../../../../api/utils/sleep'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { removeContextDoc } from '../../../../controllers/document/removeContextDoc'
import { insertUpdateCurriculumForm } from '../../insertUpdateCurriculumForm'
import { unitCreateSchema } from '../../../../../contexts/curriculum/curriculum/unit/unitCreateSchema'
import { unitMaterialCount } from '../../../../../contexts/curriculum/curriculum/unit/unitMaterialCount'
import { getCollection } from '../../../../../api/utils/getCollection'
import Sortable from 'sortablejs'
import '../../../../renderer/dimension/dimension'
import './pockets.html'

const API = Template.curriculumPockets.setDependencies({
  contexts: [Dimension, Unit, Pocket]
})

const editPocketSchema = API.createSchema(Pocket.schema)
const editUnitSchema = API.createSchema(unitCreateSchema({
  DimensionCollection: getCollection(Dimension.name)
}), { withDefault: true })
const _master = true
const ascendingIndex = { index: 1 }

Template.curriculumPockets.onCreated(function () {
  const instance = this
  instance.expanded = new ReactiveDict()

  const dimensionSub = API.subscribe({
    key: curriculumEditorSubKey,
    name: Dimension.publications.curriculum.name
  })
  const unitSub = API.subscribe({
    key: curriculumEditorSubKey,
    name: Unit.publications.curriculum.name
  })
  const pocketSub = API.subscribe({
    key: curriculumEditorSubKey,
    name: Pocket.publications.curriculum.name
  })

  instance.autorun(() => {
    if (dimensionSub.ready() && unitSub.ready() && pocketSub.ready()) {
      setTimeout(() => instance.state.set('loadComplete', true), 500)
    }
  })
})

Template.curriculumPockets.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  isHovered (id) {
    return id && Template.getState('hovered') === id
  },
  expanded (id) {
    return Template.instance().expanded.get(id)
  },
  pockets () {
    return cursor(() => getCollection(Pocket.name).find({ _master }))
  },
  units (pocket) {
    return cursor(() => getCollection(Unit.name).find({
      _master,
      pocket
    }, { sort: ascendingIndex }))
  },
  dimensions (arr = []) {
    return cursor(() => getCollection(Dimension.name).find({ _id: { $in: arr } }))
  },
  dragging () {
    return Template.getState('dragging')
  },
  updating (id) {
    return Template.getState('updating') === id
  },
  pocketSchema () {
    return editPocketSchema
  },
  createUnitSchema () {
    return editUnitSchema
  },
  editDoc () {
    return Template.getState('editDoc')
  },
  unitDoc () {
    return Template.getState('unitDoc')
  },
  createUnitDoc () {
    return Template.getState('createUnitDoc')
  },
  pocketContext () {
    return Pocket
  },
  unitContext () {
    return Unit
  },
  unitMaterialCount (unitDoc) {
    return unitMaterialCount(unitDoc)
  }
})

Template.curriculumPockets.onRendered(function () {
  const instance = this

  instance.autorun(() => {
    Object.keys(instance.expanded.all()).forEach(pocketId => {
      const sortList = document.querySelector(`ul[data-parent="${pocketId}"]`)

      Sortable.create(sortList, {
        animation: 150,
        handle: '.unit-sort-handle',
        ghostClass: 'blue-background-class',
        draggable: '.unit-entry',
        onEnd: async function (evt) {
          const indices = []

          instance.$(evt.target).find('li').each(function (i) {
            const listItem = instance.$(this)
            const _id = listItem.data('target')
            const index = i + 1
            indices.push({ _id, index })
          })

          updateUnitIndices({ indices })
            .catch(API.notify)
            .then(() => API.notify(true))
        },
      })
    })
  })
})

Template.curriculumPockets.events({
  'click .expand-all-button' (event, templateInstance) {
    event.preventDefault()

    const allExpanded = !templateInstance.state.get('allExpanded')
    const newState = new Map()

    getCollection(Pocket.name).find({ _master }).forEach(doc => {
      newState.set(doc._id, allExpanded)
    })

    templateInstance.expanded.set(Object.fromEntries(newState.entries()))
    templateInstance.state.set({ allExpanded })
  },
  'click .pocket-toggle-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const newValue = !templateInstance.expanded.get(targetId)
    templateInstance.expanded.set(targetId, newValue)
  },
  'mouseover/mousedown/tap .pocket-entry,.unit-entry' (event, templateInstance) {
    //event.preventDefault()
    const hovered = dataTarget(event, templateInstance)
    templateInstance.state.set({ hovered })
  },
  'mouseout/blur .pocket-entry,.unit-entry' (event, templateInstance) {
    //event.preventDefault()
    const hovered = dataTarget(event, templateInstance)

    if (templateInstance.state.get('hovered') === hovered) {
      templateInstance.state.set({ hovered: null })
    }
  },
  'click .create-pocket-button,.edit-pocket-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    if (targetId) {
      const editDoc = getCollection(Pocket.name).findOne(targetId)
      API.ensureDocument(editDoc, targetId)
      templateInstance.state.set({ editDoc })
    }
    API.showModal('editPocketModal')
  },
  'click .add-unit-button,.edit-unit-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance) // unit
    const pocketId = dataTarget(event, templateInstance, 'pocket')

    if (targetId) {
      const unitDoc = getCollection(Unit.name).findOne(targetId)
      API.ensureDocument(unitDoc, targetId)
      templateInstance.state.set({ unitDoc })
    }

    if (pocketId) {
      const index = getCollection(Unit.name).find({ pocket: pocketId }).count() + 1
      const createUnitDoc = { pocket: pocketId, index }
      templateInstance.state.set({ createUnitDoc })
    }

    API.showModal('editUnitModal')
  },
  'hidden.bs.modal' (event, templateInstance) {
    formReset('editPocketModal')
    templateInstance.state.set({ editDoc: null })
  },
  'submit #editPocketForm' (event, templateInstance) {
    event.preventDefault()

    insertUpdateCurriculumForm({
      context: Pocket,
      formName: 'editPocketForm',
      schema: editPocketSchema,
      modalName: '#editPocketModal',
      updateName: 'newPocket',
      editDocName: 'editDoc',
      API:API,
      templateInstance
    })
  },
  'submit #editUnitForm' (event, templateInstance) {
    event.preventDefault()

    insertUpdateCurriculumForm({
      context: Unit,
      formName: 'editUnitForm',
      schema: editUnitSchema,
      modalName: '#editUnitModal',
      updateName: 'newUnit',
      editDocName: 'unitDoc',
      API: API,
      templateInstance
    })
  },
  'click .delete-unit-button' (event, templateInstance) {
    event.preventDefault()

    const unitId = dataTarget(event, templateInstance)
    const unitDoc = getCollection(Unit.name).findOne(unitId)
    API.ensureDocument(unitDoc, unitId)

    const text = 'editor.didactics.pockets.confirmDeleteUnit'
    const textOptions = { title: unitDoc.title }
    const onError = er => API.notify(er)

    confirmDialog({ text, textOptions, type: 'danger', codeRequired: true })
      .catch(onError)
      .then(async res => {
        if (!res) return

        await removeContextDoc({
          context: Unit,
          _id: unitId,
          prepare: () => templateInstance.state.set('updating', unitId),
          receive: () => templateInstance.state.set('updating', null),
          failure: onError,
          success: () => API.notify(true)
        })

        await sleep(100)
        const indices = $.map(templateInstance.$('.unit-entry'), function (el) {
          const $element = templateInstance.$(el)
          return {
            _id: $element.data('target'),
            index: Number.parseInt($element.data('index'), 10) + 1
          }
        })

        await updateUnitIndices({ indices })

        API.notify(true)
      })
  },
  'click .delete-pocket-button' (event, templateInstance) {
    event.preventDefault()

    const pocketId = dataTarget(event, templateInstance)
    const pocketDoc = getCollection(Pocket.name).findOne(pocketId)
    API.ensureDocument(pocketDoc, pocketId)

    const unitCount = getCollection(Unit.name).find({ _master, pocket: pocketId }).count()

    if (unitCount > 0) {
      const error = new Error('editor.didactics.pockets.cantDeletePocket')
      API.notify(error)
      throw error
    }

    const text = 'editor.didactics.pockets.confirmDeletePocket'
    const textOptions = { title: pocketDoc.title }

    confirmDialog({ text, textOptions, type: 'danger', codeRequired: true })
      .catch(API.notify)
      .then(res => {
        if (!res) return

        removeContextDoc({
          context: Pocket,
          _id: pocketId,
          prepare: () => templateInstance.state.set('updating', pocketId),
          receive: () => templateInstance.state.set('updating', null),
          failure: er => API.notify(er),
          success: () => API.notify(true)
        })
      })
  }
})

async function updateUnitIndices ({ indices, onError, timeout = 100 }) {
  for (const { _id, index } of indices) {
    await updateContextDoc({
      context: Unit,
      _id: _id,
      doc: { index },
      failure: onError
    })

    await sleep(timeout)
  }
}


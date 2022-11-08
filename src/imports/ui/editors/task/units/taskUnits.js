import { Template } from 'meteor/templating'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { confirmDialog } from '../../../components/confirm/confirm'
import { $in } from '../../../../api/utils/query/inSelector'
import { updateContextDoc } from '../../../controllers/document/updateContextDoc'
import { callMethod } from '../../../controllers/document/callMethod'
import { getCollection } from '../../../../api/utils/getCollection'
import './taskUnits.html'

const API = Template.teunits.setDependencies({
  contexts: [Unit, Pocket]
})

Template.teunits.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { taskDoc } = data
    instance.state.set('taskId', taskDoc._id)
    instance.state.set('task', taskDoc)

    callMethod({
      name: Unit.methods.byTaskId.name,
      args: {
        taskId: taskDoc._id
      },
      failure: er => API.fatal(er),
      success: ({ linkedUnits, unlinkedUnits }) => {
        API.log('loaded', { linkedUnits, unlinkedUnits })

        instance.state.set({
          linkedUnits, unlinkedUnits, unitsLoaded: true
        })
      }
    })
  })

  instance.autorun(() => {
    const linkedUnits = instance.state.get('linkedUnits')
    const unlinkedUnits = instance.state.get('unlinkedUnits')

    if (!linkedUnits?.length && !unlinkedUnits?.length) {
      instance.state.set('pocketsLoaded', true)
      return // skip if we have totally no units available
    }

    const pocketIds = new Set()
    const addPocketId = doc => pocketIds.add(doc.pocket)
    linkedUnits.forEach(addPocketId)
    unlinkedUnits.forEach(addPocketId)

    callMethod({
      name: Pocket.methods.all,
      args: { ids: [...pocketIds.values()] },
      failure: API.notify,
      success: pocketDocs => {
        instance.state.set({
          pocketDocs,
          pocketsLoaded: true
        })
      }
    })
  })
})

Template.teunits.helpers({
  pockets () {
    return Template.getState('pocketDocs')
  },
  linkedUnits () {
    return Template.getState('linkedUnits')
  },
  linkedPocket (pocketId) {
    const pocketDocs = Template.getState('pocketDocs')
    return pocketDocs && pocketDocs.find(p => p._id === pocketId)
  },
  unlinkedUnits () {
    return Template.getState('unlinkedUnits')
  },
  updating (unitId) {
    return Template.getState('updating') === unitId
  }
})

Template.teunits.events({
  'click .select-unit-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#addToUnitModal').modal('show')
  },
  'click .teunits-remove-unit-button' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const taskId = templateInstance.state.get('taskId')
    const unitId = $target.data('target')
    const unitDoc = getCollection(Unit.name).findOne(unitId)
    const textOptions = { title: unitDoc.title }

    confirmDialog({ text: 'editor.task.confirmUnlink', textOptions })
      .then(result => {
        if (!result) return

        const tasks = unitDoc.tasks || []
        const index = tasks.indexOf(taskId)
        tasks.splice(index, 1)

        updateContextDoc({
          context: Unit.name,
          _id: unitDoc._id,
          doc: { tasks },
          prepare: () => templateInstance.state.set('updating', unitId),
          receive: () => templateInstance.state.set('updating', null),
          success: () => API.notify('form.updateComplete'),
          failure: er => API.notify(er)
        })
      })
      .catch(e => notify(e))
  },
  'click .teunits-add-unit-button' (event, templateInstance) {
    event.preventDefault()
    const $target = templateInstance.$(event.currentTarget)
    const taskId = templateInstance.state.get('taskId')
    const unitId = $target.data('target')
    const unitDoc = getCollection(Unit.name).findOne(unitId)
    const tasks = unitDoc.tasks || []
    tasks.push(taskId)

    updateContextDoc({
      context: Unit.name,
      _id: unitDoc._id,
      doc: { tasks },
      prepare: () => templateInstance.state.set('updating', unitId),
      receive: () => templateInstance.state.set('updating', null),
      failure: er => API.notify(er),
      success: () => {
        templateInstance.$('#addToUnitModal').modal('hide')
        API.notify('form.updateComplete')
      }
    })
  }
})

import { Template } from 'meteor/templating'
import { updateContextDoc } from '../../../../controllers/document/updateContextDoc'
import { regexQuery } from '../../../../../api/utils/query/regexQuery'
import { dataTarget } from '../../../../utils/dataTarget'
import { $in } from '../../../../../api/utils/query/inSelector'
import { debounce } from '../../../../../api/utils/debounce'
import { callMethod } from '../../../../controllers/document/callMethod'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'

import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Objective } from '../../../../../contexts/curriculum/curriculum/objective/Objective'

import '../../../../renderer/objective/objective'
import './objectives.html'

const ObjectiveLocalCollection = getLocalCollection(Objective.name)
const API = Template.ueobjectives.setDependencies({
  contexts: [Unit, Objective]
})

Template.ueobjectives.onCreated(function () {
  const instance = this

  callMethod({
    name: Objective.methods.all.name,
    args: { ids: null },
    failure: error => API.fatal(error),
    success: objectives => {
      objectives.forEach(objectiveDoc => ObjectiveLocalCollection.add(objectiveDoc))
      instance.state.set('loadComplete', true)
    }
  })

  instance.autorun(() => {
    const { unitDoc } = Template.currentData()
    instance.state.set({ unitDoc })
  })
})

Template.ueobjectives.helpers({
  loadComplete () {
    return Template.getState('loadComplete')
  },
  objectives () {
    const unitDoc = Template.getState('unitDoc')
    if (!unitDoc?.objectives) { return  }

    const cursor = ObjectiveLocalCollection.find({ _id: $in(unitDoc.objectives) })
    return (cursor && cursor.count() > 0) ? cursor : null
  },
  objectivesToAdd () {
    // const unitDoc = Template.getState('unitDoc')
    const query = {}
    const postFilter = Template.getState('postFilter')
    if (postFilter) {
      Object.assign(query, postFilter)
    }

    const transform = { sort: { index: 1 } }
    return ObjectiveLocalCollection.find(query, transform)
  },
  unitHasObjective (_id) {
    const unitDoc = Template.getState('unitDoc')
    return unitDoc?.objectives?.includes(_id)
  },
  submitting (_id) {
    return Template.getState('submitting') === _id
  },
  postFilterFound () {
    const notFound = Template.getState('postFilterNotFound')
    if (notFound) {
      return 'is-invalid'
    }
    const postFilter = Template.getState('postFilter')
    if (postFilter) {
      return 'is-valid'
    }
  },
  createObjectiveDoc () {
    const unitDoc = Template.getState('unitDoc')
    return {
      pocket: unitDoc.pocket
    }
  }
})

Template.ueobjectives.events({
  'click .ueobjectives-showmodal-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#uniteditor-objective-modal').modal('show')
  },
  'click .ueobjectives-remove-button' (event, templateInstance) {
    event.preventDefault()

    const targetId = dataTarget(event, templateInstance)
    const unitDoc = templateInstance.state.get('unitDoc')
    const objectives = unitDoc.objectives || []
    const targetIndex = objectives.indexOf(targetId)
    objectives.splice(targetIndex, 1)

    updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: { objectives },
      prepare: () => templateInstance.state.set('submitting', targetId),
      receive: () => templateInstance.state.set('submitting', null),
      failure: er => API.notify(er),
      success: () => API.notify(true)
    })
  },
  'click .ueobjectives-add-button' (event, templateInstance) {
    event.preventDefault()
    const targetId = dataTarget(event, templateInstance)
    const unitDoc = templateInstance.state.get('unitDoc')
    const objectives = unitDoc.objectives || []
    objectives.push(targetId)

    updateContextDoc({
      context: Unit,
      _id: unitDoc._id,
      doc: { objectives },
      prepare: () => templateInstance.state.set('submitting', targetId),
      receive: () => templateInstance.state.set('submitting', null),
      failure: er => API.notify(er),
      success: () => API.notify(true)
    })
  },
  'click .ueobjectives-create-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.$('#uniteditor-objective-create-modal').modal('show')
  },
  'input .objectives-filter': debounce(function (event, templateInstance) {
    const val = templateInstance.$(event.currentTarget).val()
    if (val.length < 2) {
      templateInstance.state.set('postFilter', null)
      templateInstance.state.set('postFilterNotFound', false)
      return
    }

    const req = regexQuery(val)
    const query = {
      $or: [
        { index: req },
        { title: req }
      ]
    }

    if (ObjectiveLocalCollection.find(query).count() > 0) {
      templateInstance.state.set('postFilter', query)
      templateInstance.state.set('postFilterNotFound', false)
    } else {
      templateInstance.state.set('postFilter', null)
      templateInstance.state.set('postFilterNotFound', true)
    }
  }, 500)
})

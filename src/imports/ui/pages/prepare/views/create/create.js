/* global AutoForm */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Wizard } from '../../../../../api/wizard/Wizard'

import { SchoolClass } from '../../../../../contexts/classroom/schoolclass/SchoolClass'
import { Schema, ErrorTypes } from '../../../../../api/schema/Schema'
import { Pocket } from '../../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Unit } from '../../../../../contexts/curriculum/curriculum/unit/Unit'
import { Dimension } from '../../../../../contexts/curriculum/curriculum/dimension/Dimension'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { LessonMaterial } from '../../../../controllers/LessonMaterial'
import { i18n } from '../../../../../api/language/language'
import { Material } from '../../../../../contexts/material/Material'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'

import { formIsValid } from '../../../../components/forms/formUtils'
import { cursor } from '../../../../../api/utils/cursor'
import { dataTarget } from '../../../../utils/dataTarget'
import { findUnassociatedMaterial } from '../../../../../api/utils/findUnassociatedMaterial'
import { $in } from '../../../../../api/utils/query/inSelector'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { createMaterialPreview } from '../../../../../contexts/material/createMaterialPreview'
import dragscroll from 'dragscroll/dragscroll'

import '../../../../renderer/phase/nonphaseMaterial/nonPhaseMaterial'
import '../../../../renderer/dimension/dimension'
import './create.scss'
import './create.html'

// We first need to initialize the dependencies for all materials
// and some classroom related contexts.

const API = Template.createClass.setDependencies({
  contexts: [Unit, SchoolClass, Lesson, Phase, Dimension, Pocket]
})

// Then we initialize the wizard

const wizardInitialized = Wizard.init({
  i18n: i18n.get,
  onError (e) {
    API.notify(e)
    setTimeout(() => window.location.reload({ forceReload: true }), 1000)
  }
})

const ViewStates = {
  choose: 'choose',
  create: 'create',
  createUnit: 'createUnit',
  pocket: 'pocket',
  unit: 'unit',
  phases: 'phases'
}

Template.createClass.onCreated(function () {
  const instance = this
  instance.state.set('disabledDimensions', [])

  // open all pockets by default
  const pocketOpen = { __custom__: true }

  getLocalCollection(Pocket.name).find().forEach(pocketDoc => {
    pocketOpen[pocketDoc._id] = true
  })

  instance.state.set({ pocketOpen })

  // create new wizard instance and
  // make wizard available in helpers/events
  const wizard = Wizard.create({
    defaultState: ViewStates.choose
  })

  instance.wizard = wizard

  const userId = Meteor.userId()

  // load all my SchoolClasses

  instance.autorun(() => {
    const schoolClasses = getLocalCollection(SchoolClass.name).find({ createdBy: userId })
    const schoolClassesComplete = instance.state.get('schoolClassesComplete')

    if (!schoolClassesComplete) {
      const hasClasses = schoolClasses.count() > 0
      instance.state.set('hasClasses', hasClasses)
      if (!hasClasses) {
        wizard.clear(true)
        wizard.pushView(ViewStates.create)
      }
      instance.state.set('schoolClassesComplete', true)
    }
  })

  // load phases and material in case a unit has been selected
  let materialInitialized = false

  instance.autorun(() => {
    if (!wizard.isCurrentState(ViewStates.phases)) {
      return
    }

    const unit = instance.state.get('selectedUnit')
    if (!unit) return

    const unitDoc = getLocalCollection(Unit.name).findOne(unit)
    if (!unitDoc) return

    // unset states to display loading indicators

    instance.state.set({
      phaseLoaded: false,
      associatedPhases: null,
      unassociatedMaterial: null
    })

    // init material contexts if not done yet

    if (!materialInitialized) {
      getMaterialContexts().forEach(ctx => API.initContext(ctx))
      materialInitialized = true
    }

    LessonMaterial.load(unitDoc, (error, result) => {
      if (error) return API.notify(error)

      const unassociatedMaterial = findUnassociatedMaterial(unitDoc)

      instance.state.set({
        associatedPhases: result.phases,
        unassociatedMaterial: unassociatedMaterial,
        phaseLoaded: true
      })
    })
  })
})

Template.createClass.onDestroyed(function () {
  const instance = this
  instance.state.clear()
})

Template.createClass.onRendered(function () {
  const instance = this

  instance.autorun(() => {
    if (instance.wizard.isCurrentState(ViewStates.unit)) {
      setTimeout(() => dragscroll.reset(), 100)
    }
  })

  instance.autorun(() => {
    if (instance.wizard.isCurrentState(ViewStates.choose)) {
      instance.$('.prepare-class-select').val(null)
      instance.state.set('selectedClass', null)
    }
    if (instance.wizard.isCurrentState(ViewStates.unit)) {
      instance.state.set('selectedUnit', null)
    }
  })
})

Template.createClass.helpers({
  loadComplete () {
    return API.initComplete() && wizardInitialized.get() && Template.getState('schoolClassesComplete')
  },
  hasClasses () {
    return Template.getState('hasClasses')
  },
  createNum () {
    return Template.getState('hasClasses') ? null : 1
  },
  schoolClasses () {
    return cursor(() => getLocalCollection(SchoolClass.name).find({ createdBy: Meteor.userId() }))
  },
  createUnitDoc () {
    return Template.getState('createUnitDoc')
  },
  createSchoolClassDoc () {
    return Template.getState('createSchoolClassDoc')
  },
  myClasses () {
    return getLocalCollection(SchoolClass.name).find({ createdBy: Meteor.userId() })
  },
  pockets () {
    const unitId = Template.getState('selectedUnit')
    const unitDoc = unitId && getLocalCollection(Unit.name).findOne(unitId)
    const query = {}
    if (unitDoc) {
      query._id = unitDoc.pocket
    }

    return getLocalCollection(Pocket.name).find(query).fetch()
  },
  selectedPocket (pocketId) {
    const unitId = Template.getState('selectedUnit')
    if (!unitId) return false
    const unitDoc = getLocalCollection(Unit.name).findOne(unitId)
    return unitDoc.pocket === pocketId
  },
  unitAlreadyCreated (unitId) {
    const userId = Meteor.userId()
    const classId = Template.getState('selectedClass')
    if (!classId) return false

    return getLocalCollection(Lesson.name).findOne({
      createdBy: userId,
      unitOriginal: unitId,
      classId
    })
  },
  lessonIsRunning (lessonDoc) {
    return LessonStates.isRunning(lessonDoc)
  },
  lessonIsIdle (lessonDoc) {
    return LessonStates.isIdle(lessonDoc)
  },
  unitsForPocket (pocketId) {
    const userId = Meteor.userId()
    const disabledDimensions = Template.getState('disabledDimensions')
    const selectedUnit = Template.getState('selectedUnit')
    const query = {
      _master: true,
      pocket: pocketId
    }

    if (selectedUnit) {
      query._id = selectedUnit
    }

    return getLocalCollection(Unit.name).find(query, { sort: { index: 1 } })
      .fetch()
      .filter(unitDoc => {
        if (!unitDoc.dimensions || unitDoc.dimensions.length === 0) {
          return true
        }

        return unitDoc.dimensions
          .filter(dimension => !disabledDimensions.includes(dimension))
          .length > 0
      })
  },
  unitDoc () {
    const unitId = Template.getState('selectedUnit')
    return getLocalCollection(Unit.name).findOne(unitId)
  },
  selectedUnit (unitId) {
    return Template.getState('selectedUnit') === unitId
  },
  dimensions (ids = []) {
    return getLocalCollection(Dimension.name).find({ _id: $in(ids) })
  },
  allDimension () {
    return getLocalCollection(Dimension.name).find()
  },
  dimensionDisabled (dimensionId) {
    const disabledDimensions = Template.getState('disabledDimensions')
    return disabledDimensions && disabledDimensions.includes(dimensionId)
  },
  phaseLoaded () {
    return Template.getState('phaseLoaded')
  },
  phasesForUnit () {
    return Template.getState('associatedPhases')
  },
  unassociatedMaterial () {
    return Template.getState('unassociatedMaterial')
  },
  reference (entry) {
    console.debug({ entry })
    const ctx = Material.get(entry.collection || entry.type)
    return {
      ...ctx,
      ...entry
    }
  },
  submitting () {
    return Template.getState('submitting')
  },
  pocketOpen (pocketId) {
    return Template.getState('pocketOpen')[pocketId]
  },
  isCustomPocket (id) {
    return id === '__custom__'
  },
  isCustomUnit (unitDoc) {
    return unitDoc && !unitDoc._master && !unitDoc._original
  },
  previewMaterial () {
    return Template.getState('previewMaterial')
  }
})

Template.createClass.helpers(Wizard.getHelpers())

Template.createClass.events({
  'click .pocket-toggle' (event, templateInstance) {
    event.preventDefault()
    const pocketOpen = templateInstance.state.get('pocketOpen')
    const pocketId = dataTarget(event, templateInstance)
    pocketOpen[pocketId] = !pocketOpen[pocketId]
    templateInstance.state.set({ pocketOpen })
  },
  'change .prepare-class-select' (event, templateInstance) {
    event.preventDefault()
    const selectedClass = templateInstance.$(event.currentTarget).val()
    templateInstance.state.set('selectedClass', selectedClass)
    templateInstance.wizard.pushView(ViewStates.unit, 'chooseClass')
  },
  'click .select-unit-button' (event, templateInstance) {
    event.preventDefault()
    const unitId = dataTarget(event, templateInstance)
    templateInstance.state.set('selectedUnit', unitId)
    templateInstance.state.set('submitting', true)
    templateInstance.wizard.pushView(ViewStates.phases, 'selectUnit')
  },
  'click .complete-phases-button' (event, templateInstance) {
    event.preventDefault()
    completeWizard(templateInstance, templateInstance.data.onComplete)
  },
  'click .complete-phases-edit-button' (event, templateInstance) {
    event.preventDefault()
    completeWizard(templateInstance, templateInstance.data.onCompleteEdit)
  },
  'click .filter-dimension-button' (event, templateInstance) {
    event.preventDefault()

    const dimensionId = dataTarget(event, templateInstance)
    const disabledDimensions = templateInstance.state.get('disabledDimensions')
    const index = disabledDimensions.indexOf(dimensionId)

    if (index > -1) {
      disabledDimensions.splice(index, 1)
    }
    else {
      disabledDimensions.push(dimensionId)
    }

    templateInstance.state.set({ disabledDimensions })
  },
  'click .phase-material-preview-btn': async (event, templateInstance) => {
    event.preventDefault()

    // TODO move into own function like "previewMaterial"
    const docId = dataTarget(event, templateInstance)
    const contextName = dataTarget(event, templateInstance, 'collection')

    try {
      const previewMaterial = await createMaterialPreview({
        docId,
        contextName,
        templateInstance
      })
      templateInstance.state.set({ previewMaterial })
      setTimeout(() => API.showModal('material-preview-modal'), 100)
    }
    catch (e) {
      API.notify(e)
    }
  },
  'hidden.bs.modal' (event, templateInstance) {
    templateInstance.state.set({ previewMaterial: null })
  }
})

Template.createClass.events(Wizard.getEvents())

function createLesson ({ classId, unitId }, callback) {
  Meteor.call(Lesson.methods.create.name, {
    classId,
    unit: unitId
  }, (err, lessonResults) => {
    if (err) {
      return API.notify(err)
    }
    else {
      API.notify('form.insertComplete')
      return callback(lessonResults)
    }
  })
}

function completeWizard (templateInstance, onComplete) {
  templateInstance.state.set('submitting', true)
  const originalUnitId = templateInstance.state.get('selectedUnit')
  const classId = templateInstance.state.get('selectedClass')
  createLesson({ classId, unitId: originalUnitId }, ({ lessonId, unitId }) => {
    if (onComplete) {
      setTimeout(() => onComplete({ lessonId, classId, originalUnitId, unitId }), 500)
    }
  })
}

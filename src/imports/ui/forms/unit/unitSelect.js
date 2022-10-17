/* global AutoForm */
import { Template } from 'meteor/templating'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { cursor } from '../../../api/utils/cursor'
import { dataTarget } from '../../utils/dataTarget'
import unitSelectLanguage from './i18n/unitSelectLanguage'
import '../../renderer/dimension/dimension'
import { LessonStates } from '../../../contexts/classroom/lessons/LessonStates'
import './unitSelect.html'

AutoForm.addInputType('unitSelect', {
  template: 'afUnitSelect',
  valueOut () {
    return this.val()
  }
})

const API = Template.afUnitSelect.setDependencies({
  language: unitSelectLanguage
})

Template.afUnitSelect.onCreated(function () {
  const instance = this
  instance.state.set({ disabledDimensions: {} })

  instance.autorun(() => {
    const { classId } = Template.currentData().atts
    const disabledDimensions = instance.state.get('disabledDimensions')
    const hideWithLessons = disabledDimensions.withLessons
    const disabledDimensionsList = Object
      .entries(disabledDimensions)
      .filter(entry => entry[1])
      .map(entry => entry[0])

    const availablePockets = []

    API.debug(getLocalCollection(Pocket.name).find().fetch())
    API.debug(getLocalCollection(Unit.name).find().fetch())

    getLocalCollection(Pocket.name)
      .find({ _master: true, _custom: null }, { sort: { title: 1 } })
      .forEach(pocketDoc => {
        const selector = {
          _master: true,
          pocket: pocketDoc._id,
          _custom: null,
          dimensions: { $nin: disabledDimensionsList }
        }
        const units = getLocalCollection(Unit.name).find(selector)
          .fetch()
          .filter(unitDoc => {
            const lessonDoc = getLocalCollection(Lesson.name).findOne({ classId, unitOriginal: unitDoc._id })

            if (!hideWithLessons) {
              unitDoc.lesson = lessonDoc
              API.debug(pocketDoc.title, 'filter (has lesson)', unitDoc.title)
              return true
            }

            if (!lessonDoc) {
              API.debug(pocketDoc.title, 'filter (no lesson)', unitDoc.title)
              return true
            }

            const isCompleted = LessonStates.isCompleted(lessonDoc)
            if (isCompleted) {
              API.debug(pocketDoc.title, 'filter (is completed)', unitDoc.title)
            }
            return isCompleted
          })
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))

        // then count the remaining units and only add the pocket if there are units left
        const count = units.length
        API.debug(pocketDoc.title, 'count:', units.length)
        if (count) {
          availablePockets.push({
            pocket: pocketDoc,
            units,
            count
          })
        }
      })

    instance.state.set({ availablePockets })
  })
})

Template.afUnitSelect.helpers({
  availablePockets () {
    return Template.getState('availablePockets')
  },
  lesson (unitId) {
    const { classId } = Template.currentData().atts
    return
  },
  pocketCtx () {
    return Pocket
  },
  isSelected (unitId) {
    return unitId && Template.getState('selectedUnit') === unitId
  },
  inputAtts () {
    const { units, ...atts } = Template.currentData().atts
    return atts
  },
  dimensions (ids) {
    return ids && cursor(() => getLocalCollection(Dimension.name).find({ _id: { $in: ids } }))
  },
  allDimension () {
    return getLocalCollection(Dimension.name).find()
  },
  dimensionDisabled (dimensionId) {
    const disabledDimensions = Template.getState('disabledDimensions')
    return disabledDimensions[dimensionId]
  },
  hideWithLessons () {
    const disabledDimensions = Template.getState('disabledDimensions')
    return disabledDimensions.withLessons
  }
})

Template.afUnitSelect.events({
  'click .select-unit' (event, templateInstance) {
    event.preventDefault()
    const unitId = dataTarget(event, templateInstance)
    const currentUnit = templateInstance.state.get('selectedUnit')
    const selectedUnit = unitId === currentUnit
      ? ''
      : unitId
    templateInstance.state.set({ selectedUnit })
    updateHidden({ templateInstance })
  },
  'click .filter-dimension-button' (event, templateInstance) {
    const dimensionId = dataTarget(event, templateInstance)
    templateInstance.toggle('disabledDimensions', dimensionId)
  }
})

const updateHidden = ({ templateInstance }) => templateInstance
  .$('.hidden-input')
  .val(templateInstance.state.get('selectedUnit'))

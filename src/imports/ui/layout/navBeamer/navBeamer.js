import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Beamer } from '../../../contexts/beamer/Beamer'
import { SubsManager } from '../../subscriptions/SubsManager'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { dataTarget } from '../../utils/dataTarget'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import '../../components/color/selector/colorSelector'
import '../../generic/print/print'
import './navBeamer.css'
import './navBeamer.html'
import { getCollection } from '../../../api/utils/getCollection'
import { TaskResults } from '../../../contexts/tasks/results/TaskResults'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

/*
 Beamer nav contains a nav menu to trigger global beamer actions.
 */

const colorValues = Object.values(Beamer.ui.backgroundColors)
const gridLayouts = Object.values(Beamer.ui.gridLayouts)

const API = Template.navBeamer.setDependencies({
  contexts: [Lesson, Unit]
})

Template.navBeamer.onCreated(function onCreated () {
  const instance = this
  instance.state.set('availableLessons', [])

  instance.autorun(() => {
    if (!Meteor.userId()) return
    const beamerSub = SubsManager.subscribe(Beamer.publications.my.name)
    if (beamerSub.ready()) {
      const beamerDoc = Beamer.doc.get()
      instance.state.set('beamerDoc', beamerDoc)
    }
  })

  API.subscribe({
    name: Lesson.publications.myRunning,
    args: {},
    key: 'beamerSubKey',
    callbacks: {
      onError: API.notify,
      onReady: () => {
        instance.state.set('lessonsSubComplete', true)
      }
    }
  })

  instance.autorun(() => {
    if (!instance.state.get('lessonsSubComplete')) {
      return
    }

    const lessonId = getQueryParam('lessonId')
    const availableLessons = instance.state.get('availableLessons')

    if (availableLessons.length > 0) {
      const currentLesson = availableLessons.find(entry => entry.lessonDoc._id === lessonId)
      instance.state.set({ currentLesson })
    }
  })

  instance.autorun(() => {
    const beamerDoc = Beamer.doc.get()
    if (!beamerDoc || !instance.state.get('lessonsSubComplete')) {
      return instance.state.set({
        availableLessons: []
      })
    }

    const query = {
      createdBy: Meteor.userId(),
      startedAt: { $exists: true },
      completedAt: { $exists: false }
    }
    const runningLessons = getCollection(Lesson.name).find(query)

    if (runningLessons.count() === 0) {
      return instance.state.set({
        availableLessons: []
      })
    }

    const unitIds = new Set()
    const classIds = new Set()

    runningLessons.forEach(lessonDoc => {
      classIds.add(lessonDoc.classId)
      unitIds.add(lessonDoc.unit)
    })

    // load units for running lessons
    loadIntoCollection({
      name: Unit.methods.all,
      args: { ids: [...unitIds] },
      failure: API.fatal,
      collection: getLocalCollection(Unit.name),
      success: () => {
        const beamerRefs = beamerDoc.references ?? []

        const availableLessons = runningLessons.map(lessonDoc => {
          const refsCount = beamerRefs.filter(ref => ref.lessonId === lessonDoc._id).length
          const unitDoc = getLocalCollection(Unit.name).findOne(lessonDoc.unit)
          return {
            lessonDoc,
            unitDoc,
            refsCount
          }
        })
        instance.state.set({ availableLessons })
      }
    })
  })
})

Template.navBeamer.helpers({
  loadComplete () {
    const instance = Template.instance()
    return instance.state.get('beamerDoc')
  },
  active () {

  },
  beamerColors () {
    return colorValues
  },
  gridLayouts () {
    return gridLayouts
  },
  background () {
    return Beamer.doc.background()
  },
  onModal (type) {
    return Template.instance().state.get('onModal') === type
  },
  isCurrentLayout (value) {
    const instance = Template.instance()
    const beamerDoc = instance.state.get('beamerDoc')
    return beamerDoc && beamerDoc.ui && beamerDoc.ui.grid === value
  },
  currentLesson () {
    return Template.getState('currentLesson')
  },
  availableLessons () {
    return Template.getState('availableLessons')
  }
})

Template.navBeamer.events({
  'click .modal-select-button' (event, templateInstance) {
    event.preventDefault()
    const type = dataTarget(event, templateInstance, 'type')
    templateInstance.state.set('onModal', type)
    templateInstance.$('#beamer-select-modal').modal('show')
  },
  'click .color-selector-target' (event, templateInstance) {
    event.preventDefault()
    const background = dataTarget(event, templateInstance)
    Beamer.doc.background(background, (err /*, res */) => {
      if (err) return API.notify(err)
    })
  },
  'click .grid-selector-target' (event, templateInstance) {
    event.preventDefault()
    const value = dataTarget(event, templateInstance, 'value')
    Beamer.doc.grid(value, (err /*, res */) => {
      if (err) return API.notify(err)
    })
  }
})

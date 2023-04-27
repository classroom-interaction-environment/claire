import { Template } from 'meteor/templating'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import { setQueryParams } from '../../../api/routes/params/setQueryParams'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import lessonsLanguage from './i18n/lessonsLanguage'
import '../../layout/submenu/submenu'
import '../../generic/templateLoader/TemplateLoader'
import './lesson.scss'
import './lessons.html'

const API = Template.lessons.setDependencies({
  contexts: [Unit, Lesson, Pocket],
  language: lessonsLanguage
})

const Views = {
  ongoing: {
    name: 'ongoing',
    label: 'lessons.ongoing',
    template: 'ongoingLessons',
    load: async function () {
      return import('./views/ongoing/ongoing')
    }
  },
  completed: {
    name: 'completed',
    label: 'lessons.completed',
    template: 'completeLessons',
    load: async function () {
      return import('./views/complete/complete')
    }
  }
}

const viewStates = Object.values(Views)
const SchoolClassCollection = getLocalCollection(SchoolClass.name)
const UnitCollection = getLocalCollection(Unit.name)
const PocketCollection = getLocalCollection(Unit.name)
const LessonCollection = getLocalCollection(Lesson.name)

Template.lessons.onCreated(async function () {
  const instance = this
  const skipLessons = LessonCollection.find().map(doc => doc._id)

  await loadIntoCollection({
    name: Lesson.methods.my,
    args: { skip: skipLessons },
    failure: API.fatal,
    collection: LessonCollection,
    success: () => instance.state.set('lessonSubComplete', true)
  })

  const classIds = new Set()
  LessonCollection.find().forEach(lessonDoc => classIds.add(lessonDoc.classId))

  await loadIntoCollection({
    name: SchoolClass.methods.my,
    args: { ids: [...classIds.values()] },
    failure: API.fatal,
    collection: SchoolClassCollection,
    success: () => instance.state.set('schoolClassSubComplete', true)
  })

  instance.autorun(computation => {
    if (!instance.state.get('lessonSubComplete')) return

    const unitIds = getLocalCollection(Lesson.name).find().map(lessonDoc => lessonDoc.unit)
    if (!unitIds || unitIds.length === 0) {
      instance.state.set('unitsLoaded', true)
      return
    }

    loadIntoCollection({
      name: Unit.methods.all,
      args: { ids: unitIds },
      collection: UnitCollection,
      failure: API.fatal,
      success: unitDocs => {
        computation.stop()
        instance.state.set('unitsLoaded', true)
      }
    })
  })

  instance.autorun(computation => {
    if (!instance.state.get('unitsLoaded')) return

    const pocketIds = new Set()
    UnitCollection.find().forEach(unitDoc => {
      if (unitDoc.pocket !== '__custom__') {
        pocketIds.add(unitDoc.pocket)
      }
    })

    loadIntoCollection({
      name: Pocket.methods.all,
      args: { ids: [...pocketIds.values()] },
      collection: PocketCollection,
      failure: API.fatal,
      success: () => instance.state.set('pocketSubComplete', true)
    })

    computation.stop()
  })
})

Template.lessons.helpers({
  loadComplete () {
    const state = Template.instance().state
    return state.get('lessonSubComplete')
  },
  submenuData () {
    const instance = Template.instance()
    return {
      views: viewStates,
      queryParam: 'view',
      getQueryParam: getQueryParam,
      updateQueryParam: setQueryParams,
      nav: {
        justified: true
      },
      onViewSelected: function (currentViewName) {
        instance.state.set({ currentViewName })
      }
    }
  },
  currentView () {
    const instance = Template.instance()
    const viewName = instance.state.get('currentViewName')
    const viewState = Views[viewName]
    if (!viewState) return

    viewState.templateData = instance.templateData
    return viewState
  }
})

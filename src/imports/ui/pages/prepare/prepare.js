import { Template } from 'meteor/templating'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'
import { SchoolClass } from '../../../contexts/classroom/schoolclass/SchoolClass'
import { Pocket } from '../../../contexts/curriculum/curriculum/pocket/Pocket'
import { Unit } from '../../../contexts/curriculum/curriculum/unit/Unit'
import { Dimension } from '../../../contexts/curriculum/curriculum/dimension/Dimension'
import { PrepareViewStates } from './PrepareViewStates'
import { dataTarget } from '../../utils/dataTarget'
import { setQueryParams } from '../../../api/routes/params/setQueryParams'
import { getQueryParam } from '../../../api/routes/params/getQueryParam'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import prepareLanguage from './i18n/prepareLanguage'
import '../../layout/submenu/submenu'
import '../../generic/templateLoader/TemplateLoader'
import './prepare.html'
import { loadSelectableUnits } from '../../../contexts/curriculum/loadSelectableUnits'

const viewStates = Object.values(PrepareViewStates)
const allContexts = [Pocket, Unit, Dimension]

const API = Template.prepare.setDependencies({
  contexts: allContexts.concat([Lesson, SchoolClass]),
  language: prepareLanguage
})

const createCompleteKey = ctx => `${ctx.name}Complete`
const lessonComplete = createCompleteKey(Lesson)
const schoolClassComplete = createCompleteKey(SchoolClass)

Template.prepare.onCreated(async function () {
  const instance = this
  instance.state.set('currentViewName', PrepareViewStates.create.name)

  // we only need to load a subset of available units/pockets/dimensions
  // which has already been implemented in the method below:
  await loadSelectableUnits({
    onError: API.notify
  })

  // we need all our classes though
  await loadIntoCollection({
    name: SchoolClass.methods.my,
    failure: API.notify,
    collection: getLocalCollection(SchoolClass.name),
    success: () => instance.state.set(createCompleteKey(SchoolClass), true)
  })

  // TODO load after class has been selected to narrow down loading to a few docs
  // we just need those lessons that are not completed and that are linnked to
  // one of the given units
  const LessonCollection = getLocalCollection(Lesson.name)
  const skipLessonIds = new Set(LessonCollection.find().map(lessonDoc => lessonDoc._id))
  const unitIds = new Set(getLocalCollection(Unit.name).find().map(unitDoc => unitDoc._id))
  const args = { completed: false }

  if (skipLessonIds.size > 0) {
    args.skip = [...skipLessonIds]
  }

  if (unitIds.size > 0) {
    args.units = [...unitIds]
  }

  await loadIntoCollection({
    name: Lesson.methods.my,
    args: args,
    collection: LessonCollection,
    failure: API.notify,
    success: () => instance.state.set(createCompleteKey(Lesson), true)
  })
})

Template.prepare.helpers({
  loadComplete () {
    const state = Template.instance().state
    return state.get(lessonComplete) &&
      state.get(schoolClassComplete)
  },
  submenuData () {
    const instance = Template.instance()
    console.debug('submenu data')
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
    if (!viewName) return

    const view = PrepareViewStates[viewName]
    if (!view) return

    const { onCompleteEdit } = instance.data
    const templateData = Object.assign({
      onComplete ({ lessonId, classId }) {
        setQueryParams({
          view: PrepareViewStates.classes.name,
          lessonId: lessonId,
          classId: classId
        })
      },
      onCompleteEdit ({ /* lessonId, classId,*/  unitId }) {
        if (onCompleteEdit) onCompleteEdit({ unitId })
      }
    }, instance.data, view.templateData)
    return Object.assign({}, view, { templateData })
  },
})

Template.prepare.events({
  'click .prepare-tab' (event, templateInstance) {
    event.preventDefault()
    const target = dataTarget(event, templateInstance)
    setQueryParams({ view: target })
  }
})

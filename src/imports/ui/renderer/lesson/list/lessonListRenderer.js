import { Template } from 'meteor/templating'
import { SchoolClass } from '../../../../contexts/classroom/schoolclass/SchoolClass'
import { Unit } from '../../../../contexts/curriculum/curriculum/unit/Unit'
import { Pocket } from '../../../../contexts/curriculum/curriculum/pocket/Pocket'
import { LessonStates } from '../../../../contexts/classroom/lessons/LessonStates'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'

import '../../../components/lesson/status/lessonStatus'
import '../../../components/documentState/documentState'
import './lessonListRenderer.html'

const API = Template.lessonListRenderer.setDependencies({
  contexts: [SchoolClass, Unit, Pocket]
})

Template.lessonListRenderer.helpers({
  liAtts (classNames) {
    const instance = Template.instance()
    const liClass = instance.data?.liClass || ''
    return {
      class: `${classNames} ${liClass}`
    }
  },
  schoolClass (classId) {
    return getLocalCollection(SchoolClass.name).findOne(classId)
  },
  unit (unitId) {
    if (typeof unitId === 'object') { return unitId }
    return getLocalCollection(Unit.name).findOne(unitId)
  },
  pocket (unitId) {
    const unitDoc = getLocalCollection(Unit.name).findOne(unitId)
    if (!unitDoc) {
      return
    }

    if (unitDoc.pocket === '__custom__') {
      return { icon: 'user', title: API.translate('unit.custom') }
    }

    const pocketDoc = getLocalCollection(Pocket.name).findOne(unitDoc.pocket)
    if (pocketDoc) {
      return { icon: Pocket.icon, title: `${API.translate(Pocket.label)} ${pocketDoc.title}` }
    }
  },
  getTime (lessonDoc) {
    const { showTime } = Template.instance().data
    if (!showTime) return

    const { timeMode } = LessonStates.getState(lessonDoc)
    return {
      label: timeMode.label,
      value: lessonDoc[timeMode.field]
    }
  }

})

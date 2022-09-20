import { Template } from 'meteor/templating'
import { LessonStates } from '../../../../contexts/classroom/lessons/LessonStates'
import '../../../generic/tooltip/tooltip'
import './lessonStatus.html'

Template.lessonStatus.helpers({
  isIdle (lessonDoc) {
    return lessonDoc && LessonStates.isIdle(lessonDoc)
  },
  isComplete (lessonDoc) {
    return LessonStates.isCompleted(lessonDoc)
  },
  isRunning (lessonDoc) {
    return LessonStates.isRunning(lessonDoc)
  },
  lessonDoc () {
    return Template.instance().data.lessonDoc
  },
  tooltipClass (color) {
    const { data } = Template.instance()
    const type = data.bg !== false
      ? `badge-${color}`
      : ''

    return `badge ${type} text-wrap text-center m-0 p-2`
  }
})

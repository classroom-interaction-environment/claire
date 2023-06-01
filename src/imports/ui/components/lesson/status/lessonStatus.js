import { Template } from 'meteor/templating'
import { LessonStates } from '../../../../contexts/classroom/lessons/LessonStates'
import lessonStatusLang from './i18n/lessonStatusLang'
import '../../../generic/tooltip/tooltip'
import './lessonStatus.html'

const failedState = ({ bg }) => ({
  class: getTooltipClass({ bg, color: 'warning' }),
  label: 'lesson.unexpectedState',
  icon: 'exclamation-triangle',
  iconClass: getIconClass({ bg, color: 'warning' })
})

const getTooltipClass = ({ bg, color }) => {
  const type = bg !== false
    ? `badge-${color}`
    : ''
  return `badge ${type} text-wrap text-center m-0 p-2`
}
const getIconClass = ({ bg, color }) => bg === false
  ? `text-${color}`
  : ''

Template.lessonStatus.setDependencies({
  language: lessonStatusLang
})

Template.lessonStatus.helpers({
  attributes () {
    const { lessonDoc, bg, colorize } = Template.currentData()

    try {
      const { label, color, icon } = LessonStates.getState(lessonDoc)
      const tooltipClass = getTooltipClass({ bg, color })
      const iconClass = getIconClass({ bg, color })
      return { label, icon, colorize, tooltipClass, iconClass }
    }
    catch (e) {
      console.error(e)
      return failedState({ bg })
    }
  }
})

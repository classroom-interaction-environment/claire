import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { LessonActions } from '../../../../controllers/LessonActions'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { createLog } from '../../../../../api/log/createLog'
import '../../../../renderer/user/list/userListRenderer'
import '../../../../editors/groups/groupsEditor'
import './info.html'
import './info.scss'

const debug = createLog({ name: Lesson.name })
const API = Template.lessonInfo.setDependencies({
  contexts: [Lesson]
})

Template.lessonInfo.onCreated(function () {
  const instance = this

  instance.onStudentRemove = (options) => {
    API.log('on student removed', options)
  }

  instance.autorun(() => {
    const { classDoc } = Template.currentData()
    if (!classDoc) {
      return
    }
    const students = Meteor.users.find({ _id: { $in: classDoc.students ?? [] } }).fetch()
    instance.state.set({ students })
  })
})

Template.lessonInfo.helpers({
  loadComplete () {
    return API.initComplete()
  },
  onRemove () {
    return Template.instance().onStudentRemove
  },
  canRestart () {
    const { lessonDoc } = Template.instance().data
    return LessonStates.canRestart(lessonDoc)
  },
  studentsForLesson () {
    return Template.getState('students')
  },
  classDoc () {
    return Template.instance().data.classDoc
  },
  groupEditorAtts () {
    const instance = Template.instance()
    const { lessonDoc, unitDoc, classDoc, unassociatedMaterial } = instance.data
    return {
      isAdhoc: true,
      lessonDoc,
      unitDoc,
      classDoc,
      unassociatedMaterial,
      phases: unitDoc.phases
    }
  }
})

Template.lessonInfo.events({
  'click .restart-lesson-button' (event, templateInstance) {
    event.preventDefault()

    confirmDialog({ text: 'lesson.actions.restartConfirm', codeRequired: true, type: 'warning' })
      .then(result => {
        if (!result) {
          return
        }

        const { lessonDoc } = templateInstance.data
        LessonActions.restart({
          _id: lessonDoc._id,
          failure: API.notify,
          success: res => {
            const { runtimeDocs, beamerReset, lessonReset } = res
            debug('lessonReset', lessonReset)
            debug('runtimeDocs', runtimeDocs)
            debug('beamerReset', beamerReset)
            API.notify(true)
          }
        })
      })
      .catch(e => API.notify(e))
  }
})

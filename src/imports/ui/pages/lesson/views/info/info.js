import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { LessonActions } from '../../../../controllers/LessonActions'
import { LessonStates } from '../../../../../contexts/classroom/lessons/LessonStates'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { FormModal } from '../../../../components/forms/modal/formModal'
import { Phase } from '../../../../../contexts/curriculum/curriculum/phase/Phase'
import { confirmDialog } from '../../../../components/confirm/confirm'
import { createLog } from '../../../../../api/log/createLog'
import { callMethod } from '../../../../controllers/document/callMethod'
import { getCollection } from '../../../../../api/utils/getCollection'
import { cursor } from '../../../../../api/utils/cursor'
import { dataTarget } from '../../../../utils/dataTarget'
import { createGroupForms } from './groupForms'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import '../../../../renderer/user/list/userListRenderer'
import '../../../../components/groupbuilder/groupBuilder'
import './info.html'
import './info.scss'

const debug = createLog({ name: Lesson.name })
const API = Template.lessonInfo.setDependencies({
  contexts: [Lesson, Group]
})
const groupForms = createGroupForms({ onError: API.notify, translate: API.translate })

Template.lessonInfo.onCreated(function () {
  const instance = this
  const { lessonDoc, classDoc, unitDoc } = instance.data
  const phaseMaterial = []
  ;(unitDoc.phases || []).forEach(phase => {
    if (phase.references) {
      phaseMaterial.push(...phase.references)
    }
  })

  instance.onStudentRemove = (options) => {
    API.log('on student removed', options)
  }

  const materialOptions = (instance.data.unassociatedMaterial || [])
    .concat(phaseMaterial)
    .map(({ collection, document }) => {
      const value = document
      const materialDoc = getLocalCollection(collection).findOne(document)
      const label = materialDoc?.title || materialDoc?.name
      return { value, label }
    })

  instance.state.set({ materialOptions })
  instance.onGroupCreated = async ({ groupSettings, groupsDoc }) => {
    const groups = groupsDoc.groups.map(group => {
      group.lessonId = lessonDoc._id
      group.classId = classDoc._id
      group.phases = groupSettings.phases
      return group
    })

    for (const doc of groups) {
      await callMethod({
        name: Group.methods.save,
        args: doc,
        failure: API.notify
      })
    }

    instance.state.set('addGroups', false)
    API.hideModal('manageGroupModal')
    API.notify(true)
  }

  instance.autorun(() => {
    const { classDoc } = Template.currentData()
    if (!classDoc) { return }
    const students = Meteor.users.find({ _id: { $in: classDoc.students ?? [] }}).fetch()
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
  groups () {
    const { lessonDoc } = Template.instance().data
    if (!lessonDoc) {
      return
    }
    return cursor(() => getCollection(Group.name).find({ lessonId: lessonDoc._id }))
  },
  groupBuilderAtts () {
    const instance = Template.instance()
    const data = Template.currentData()
    if (!instance.state.get('groupBuilderActive')) {
      return // skip to prevent offscreen drawing
    }

    return {
      lessonDoc: data.lessonDoc,
      unitDoc: data.unitDoc,
      classDoc: data.classDoc,
      phases: data.unitDoc.phases || [],
      material: instance.state.get('materialOptions'),
      onCreated: instance.onGroupCreated
    }
  },
  phaseDocs (phaseIds) {
    return phaseIds && cursor(() => getLocalCollection(Phase.name).find({ _id: { $in: phaseIds } }))
  }
})

Template.lessonInfo.events({
  'hidden.bs.modal #manageGroupModal' (event, templateInstance) {
    templateInstance.state.set('groupBuilderActive', false)
  },
  'click .group-action-btn' (event, templateInstance) {
    const action = dataTarget(event, templateInstance, 'action')
    if (action === 'create') {
      templateInstance.state.set('groupBuilderActive', true)
      return API.showModal('manageGroupModal')
    }

    const material = templateInstance.state.get('materialOptions')
    const groupId = dataTarget(event, templateInstance, 'id')
    const groupDoc = groupId && getCollection(Group.name).findOne(groupId)
    const definitions = groupForms[action]
    const doc = definitions.doc || groupDoc
    const options = {
      action,
      doc: doc,
      bind: { groupId, groupDoc, material },
      ...definitions
    }
    FormModal.show(options)
  },
  'click .restart-lesson-button' (event, templateInstance) {
    event.preventDefault()

    confirmDialog({ text: 'lesson.actions.restartConfirm', codeRequired: true, type: 'warning' })
      .then(result => {
        if (!result) return

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
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Group } from '../../../../contexts/classroom/group/Group'
import { Users } from '../../../../contexts/system/accounts/users/User'
import { Lesson } from '../../../../contexts/classroom/lessons/Lesson'
import { getCollection } from '../../../../api/utils/getCollection'
import { dataTarget } from '../../../utils/dataTarget'
import { getMaterialContexts } from '../../../../contexts/material/initMaterial'
import { loadStudentMaterial } from '../../../utils/loadStudentMaterial'
import { lessonSubKeyStudent } from '../lesson/lessonSubKeyStudent'
import studentGroupLanguage from './i18n/studentGroupLanguage'
import '../lesson/views/material/lessonMaterial'
import './group.html'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'

const API = Template.studentGroup.setDependencies({
  contexts: [Group, Lesson].concat(getMaterialContexts()),
  language: studentGroupLanguage
})

Template.studentGroup.onCreated(function () {
  const instance = this
  const { groupId, lessonId } = instance.data.params

  API.subscribe({
    name: Lesson.publications.single,
    args: { _id: lessonId },
    key: lessonSubKeyStudent,
    callbacks: {
      onError: err => {
        if (err.error === 'errors.docNotFound') {
          instance.state.set('docNotFound', true)
        }
      },
      onReady () {
        const lessonDoc = getCollection(Lesson.name).findOne(lessonId)
        instance.state.set('lessonDoc', lessonDoc)
      }
    }
  })

  API.subscribe({
    name: Group.publications.single,
    args: { groupId },
    key: 'studentGroupSub',
    callbacks: {
      onError: API.fatal,
      onReady () {
        const groupDoc = getCollection(Group.name).findOne(groupId)
        const userId = Meteor.userId()
        const me = groupDoc.users.find(user => user.userId === userId)

        if (me.role) {
          instance.state.set('currentRole', me.role)
        }

        instance.state.set('groupSubReady', true)
      }
    }
  })

  API.subscribe({
    name: Users.publications.byGroup,
    args: { groupId },
    key: 'studentGroupSub',
    callbacks: {
      onError: API.fatal,
      onReady () {
        instance.state.set('userSubReady', true)
      }
    }
  })

  instance.autorun(() => {
    const groupDoc = getCollection(Group.name).findOne(groupId)
    const userSubReady = instance.state.get('userSubReady')
    if (!groupDoc || !userSubReady) {
      return
    }

    // update members
    const members = groupDoc.users
      .map(doc => {
        const userDoc = Meteor.users.findOne(doc.userId)
        userDoc.role = doc.role
        return userDoc
      })
      .sort((a, b) => (a.role || '').localeCompare(b.role || ''))
    instance.state.set({ members })
  })

  instance.autorun(async () => {
    const groupDoc = getCollection(Group.name).findOne(groupId)
    const lessonDoc = getCollection(Lesson.name).findOne(lessonId)

    if (!groupDoc || !groupDoc?.visible?.length || !lessonDoc) {
      return instance.state.set({
        loadingMaterials: false,
        groupMaterial: null
      })
    }

    await loadStudentMaterial({
      _id: lessonDoc._id,
      groupId: groupDoc._id,
      visibleStudent: groupDoc.visible,
      prepare: () => instance.state.set('loadingMaterials', true),
      receive: () => instance.state.set('loadingMaterials', false),
      failure: err => API.fatal(err)
    })

    const groupMaterial = groupDoc.visible.map(reference => {
      reference.document = getLocalCollection(reference.context).findOne(reference._id)
      return reference
    })

    instance.state.set({ groupMaterial })
  })
})

Template.studentGroup.onDestroyed(function () {
  API.dispose('studentGroupSub')
})

Template.studentGroup.helpers({
  groupLoaded () {
    return API.initComplete() && Template.getState('groupSubReady')
  },
  groupDoc () {
    const { groupId } = Template.instance().data.params
    return getCollection(Group.name).findOne(groupId)
  },
  currentRole () {
    return Template.getState('currentRole')
  },
  members () {
    return Template.getState('members')
  },
  groupMaterial () {
    return Template.getState('groupMaterial')
  },
  loadingMaterials () {
    return Template.getState('loadingMaterials')
  }
})

Template.studentGroup.events({
  'click .show-member-btn' (event, templateInstance) {
    event.preventDefault()
    const modal = dataTarget(event, templateInstance, 'modal')
    API.showModal(modal)
  }
})

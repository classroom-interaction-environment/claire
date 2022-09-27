import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { WebResources } from '../../../../../contexts/resources/web/WebResources'
import { lessonSubKeyStudent } from '../../lesson/lessonSubKeyStudent'
import { Group } from '../../../../../contexts/classroom/group/Group'
import { loadStudentMaterial } from '../../../../utils/loadStudentMaterial'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getCollection } from '../../../../../api/utils/getCollection'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import lessonStudentLang from '../../i18n/lessonStudentLanguage'
import './media.html'

const API = Template.media.setDependencies({
  contexts: [Lesson, Group].concat(getMaterialContexts()),
  language: lessonStudentLang
})

const init = WebResources.initialize()
const LessonCollection = getCollection(Lesson.name)

Template.media.onCreated(function () {
  const instance = this

  // most important is to load the lesson doc first
  // because from here we determine the publication for
  // taskworking states that are bound to lessonId
  instance.autorun(() => {
    if (!Meteor.userId()) return
    const data = Template.currentData()
    const { params } = data
    const { lessonId, groupId } = params

    API.subscribe({
      name: Lesson.publications.single,
      args: { _id: lessonId },
      key: lessonSubKeyStudent,
      callbacks: {
        onError: e => API.fatal(e),
        onReady: () => {
          const lessonDoc = LessonCollection.findOne(lessonId)
          instance.state.set('lessonDoc', lessonDoc)
        }
      }
    })

    // if we have a group we need to sub it
    if (groupId && groupId !== 'none') {
      API.subscribe({
        name: Group.publications.single,
        args: { groupId },
        key: 'studentGroupSub',
        callbacks: {
          onError: API.fatal,
          onReady () {
            setTimeout(() => {
              const groupDoc = getCollection(Group.name).findOne(groupId)
              const userId = Meteor.userId()
              const me = groupDoc.users.find(user => user.userId === userId)

              loadIntoCollection({
                name: Group.methods.users,
                args: { groupId },
                failure: API.notify,
                collection: getLocalCollection(Meteor.users)
              })

              if (me.role) {
                instance.state.set('currentRole', me.role)
              }

              instance.state.set({ groupDoc, groupSubReady: true })
            }, 150)
          }
        }
      })
    }
    else {
      instance.state.set('groupSubReady', true)
    }
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { type } = data.params
    const { params } = data
    const { lessonId, mediaId, groupId } = params
    const lessonDoc = instance.state.get('lessonDoc')
    const groupSubReady = instance.state.get('groupSubReady')

    if (!lessonId || !mediaId || !lessonDoc || !groupSubReady) {
      return
    }

    // fail with docNotVisible in case this material has been removed
    // from the visibleStudents list
    const byMediaId = ref => ref._id === mediaId

    // check if mediaId is still within visible fields
    const isVisible = mediaId &&
      lessonDoc &&
      lessonDoc.visibleStudent &&
      lessonDoc.visibleStudent.find(byMediaId)

    const groupDoc = getCollection(Group.name).findOne(groupId)
    const isGroupVisible = groupDoc &&
      groupDoc.visible &&
      groupDoc.visible.find(byMediaId)

    if (!isVisible && !isGroupVisible) {

      return instance.state.set({
        mediaDoc: null,
        materialLoaded: true,
        docNotVisible: true
      })
    }

    // otherwise always reset the load and visible status
    else {
      instance.state.set({
        materialLoaded: false,
        docNotVisible: false
      })
    }

    const WebResourceCollection = getLocalCollection(type)
    let mediaDoc = WebResourceCollection.findOne(mediaId)

    if (mediaDoc) {
      return instance.state.set({
        mediaDoc,
        mediaType: type,
        materialLoaded: true,
        docNotVisible: false
      })
    }

    else {
      // we need to merge visibilities to ensure it's
      // all loaded down to group-level
      const allVisible = (lessonDoc.visibleStudent || []).concat(groupDoc?.visible || [])

      loadStudentMaterial({
        _id: lessonDoc._id,
        visibleStudent: allVisible,
        groupId: groupDoc ? groupDoc._id : undefined,
        prepare: () => instance.state.set('loadingMaterials', true),
        receive: () => instance.state.set('loadingMaterials', false),
        failure: err => API.fatal(err),
        success: () => {
          mediaDoc = WebResourceCollection.findOne(mediaId)
          API.log({ mediaId, mediaDoc, all: WebResourceCollection.find().fetch() })
          instance.state.set({
            mediaDoc: mediaDoc,
            mediaType: type,
            materialLoaded: true,
            docNotVisible: !mediaDoc
          })
        }
      })
    }
  })
})

Template.media.helpers({
  loadComplete () {
    return API.initComplete() && init.get() && Template.getState('materialLoaded')
  },
  docNotVisible () {
    return Template.getState('docNotVisible')
  },
  mediaData () {
    const instance = Template.instance()
    const doc = instance.state.get('mediaDoc')
    const type = instance.state.get('mediaType')
    return doc && type && Object.assign({}, doc, {
      meta: type,
      preview: false,
      print: false,
      student: true
    })
  }
})

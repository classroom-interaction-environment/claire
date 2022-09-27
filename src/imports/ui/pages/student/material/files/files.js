import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Files } from '../../../../../contexts/files/Files'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { loadStudentMaterial } from '../../../../utils/loadStudentMaterial'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getCollection } from '../../../../../api/utils/getCollection'
import { getFilesLink } from '../../../../../contexts/files/getFilesLink'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import { loadIntoCollection } from '../../../../../infrastructure/loading/loadIntoCollection'
import { Group } from '../../../../../contexts/classroom/group/Group'
import './files.html'

const API = Template.files.setDependencies({
  contexts: [Lesson, Group].concat(getMaterialContexts())
})

const LessonCollection = getCollection(Lesson.name)

Template.files.onCreated(function () {
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
      key:'lessonMaterialStudent',
      callbacks: {
        onError: err => API.fatal(err),
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

  // once we have the files initialized we can load
  // the renderer for the current file type
  instance.autorun(() => {
    if (!API.initComplete()) return

    const data = Template.currentData()
    const { type } = data.params

    const renderer = Files.helpers.getRenderer(type)
    if (renderer) {
      renderer.load()
        .catch(e => API.fatal(e))
        .then(() => instance.state.set({ [type]: renderer.template, filesType: type }))
    }
  })

  // the following loads the material, only if it hasn't been loaded yet
  // and also ensures to display a 404 message in case the material
  // is not in the visibleStudents list anymore
  instance.autorun(() => {
    const data = Template.currentData()
    const { type } = data.params
    const { params } = data
    const { lessonId } = params
    const { fileId, groupId } = params
    const lessonDoc = instance.state.get('lessonDoc')
    const groupSubReady = instance.state.get('groupSubReady')

    // skip if necessray params are not ready
    if (!lessonId || !fileId || !lessonDoc || !groupSubReady) {
      return
    }

    // fail with docNotVisible in case this material has been removed
    // from the visibleStudents list
    const byFileId = ref => ref._id === fileId

    // check if taskId is still within visible fields
    const isVisible = fileId &&
      lessonDoc &&
      lessonDoc.visibleStudent &&
      lessonDoc.visibleStudent.find(byFileId)

    const groupDoc = getCollection(Group.name).findOne(groupId)
    const isGroupVisible = groupDoc &&
      groupDoc.visible &&
      groupDoc.visible.find(byFileId)

    if (!isVisible && !isGroupVisible) {
      return instance.state.set({
        fileDoc: null,
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

    instance.state.set('fileType', type)
    const FilesCache = getLocalCollection(type)
    let fileDoc = FilesCache.findOne(fileId)

    // if we have already loaded this material, let's just use it here
    if (fileDoc) {
      return instance.state.set({
        fileDoc: fileDoc,
        materialLoaded: true,
        docNotVisible: false
      })
    }

    else {
      const allVisible = (lessonDoc.visibleStudent || []).concat(groupDoc?.visible || [])
      loadStudentMaterial({
        _id: lessonDoc._id,
        visibleStudent: allVisible,
        groupId: groupDoc ? groupDoc._id : undefined,
        prepare: () => instance.state.set('loadingMaterials', true),
        receive: () => instance.state.set('loadingMaterials', false),
        failure: err => API.fatal(err),
        success: () => {
          fileDoc = FilesCache.findOne(fileId)
          instance.state.set({
            fileDoc: fileDoc,
            materialLoaded: true,
            docNotVisible: !fileDoc
          })
        }
      })
    }
  })
})

Template.files.helpers({
  loadComplete () {
    return API.initComplete() && Template.getState('materialLoaded')
  },
  docNotVisible () {
    return Template.getState('docNotVisible')
  },
  fileData () {
    if (!API.initComplete()) { return }
    const instance = Template.instance()
    const fileDoc = instance.state.get('fileDoc')
    const fileCtxName = instance.state.get('fileType')
    if (!fileDoc || !fileCtxName) return

    fileDoc.link = getFilesLink({
      name: fileCtxName,
      file: fileDoc,
      version: 'original'
    })

    return fileDoc && {
      data: fileDoc,
      meta: fileCtxName,
      preview: false,
      print: null,
      student: true
    }
  },
  fileTemplate (meta) {
    console.info(Template.getState(meta))
    return Template.getState(meta)
  },
  fileResource (doc) {
    const { data } = doc
    if (!data) return
    data.student = true
    data.preview = false
    return data
  }
})

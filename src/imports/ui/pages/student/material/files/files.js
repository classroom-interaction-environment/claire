import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Files } from '../../../../../contexts/files/Files'
import { Lesson } from '../../../../../contexts/classroom/lessons/Lesson'
import { loadStudentMaterial } from '../../../../utils/loadStudentMaterial'
import { getLocalCollection } from '../../../../../infrastructure/collection/getLocalCollection'
import { getCollection } from '../../../../../api/utils/getCollection'
import { getFilesLink } from '../../../../../contexts/files/getFilesLink'
import { getMaterialContexts } from '../../../../../contexts/material/initMaterial'
import './files.html'

const API = Template.files.setDependencies({
  contexts: [Lesson].concat(getMaterialContexts())
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
    const { lessonId } = params

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
    const { fileId } = params
    const lessonDoc = instance.state.get('lessonDoc')

    // skip if necessray params are not ready
    if (!lessonId || !fileId || !lessonDoc) {
      return
    }

    // fail with docNotVisible in case this material has been removed
    // from the visibleStudents list
    const byFileId = ref => ref._id === fileId
    if (!lessonDoc.visibleStudent?.length || !lessonDoc.visibleStudent.find(byFileId)) {
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
      loadStudentMaterial({
        _id: lessonDoc._id,
        visibleStudent: lessonDoc.visibleStudent,
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

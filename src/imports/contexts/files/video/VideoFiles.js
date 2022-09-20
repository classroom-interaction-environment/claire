import { FileTypes } from '../shared/FileTypes'
import { onClient, onServerExec } from '../../../api/utils/archUtils'
import { FilesTemplates } from '../FilesTemplates'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { translateReactive } from '../../../utils/translateReactive'

/**
 * VideoFiles are a material type that is used universally to upload videos,
 * either as classroom material or as item response type.
 */
export const VideoFiles = {
  name: 'videoFiles',
  fieldName: 'videos',
  label: 'files.videos',
  icon: 'file-video',
  debug: true,

  // ///////////////////////////////////////////////////////////////////////////
  //
  // BASICS
  //
  // ///////////////////////////////////////////////////////////////////////////

  schema: {},
  methods: {},
  publicFields: {},
  dependencies: [],

  // ///////////////////////////////////////////////////////////////////////////
  //
  // CURRICULUM
  //
  // ///////////////////////////////////////////////////////////////////////////
  isCurriculum: true,

  curriculum: {},

  // ///////////////////////////////////////////////////////////////////////////
  //
  // CLASSROOM
  //
  // ///////////////////////////////////////////////////////////////////////////
  isClassroom: true,

  classroom: {},

  // ///////////////////////////////////////////////////////////////////////////
  //
  // FILES
  //
  // ///////////////////////////////////////////////////////////////////////////
  isFilesCollection: true,

  /**
   * Files context definitions
   *
   * @property debug {boolean} inidicate to debug any upload/download functions
   * @property bucketName {string} the bucket where binary is stored
   * @property type {string} the file type
   * @property extensions {[String]} a list of supported extensions for upload
   * @property accept {String} a type def string to accept upload files
   * @property maxSize {number} the max upload size in bytes
   * @property usePartialResponse {boolean} prefer 206 response; for streaming
   */

  files: {
    debug: false,
    bucketName: 'videos',
    type: FileTypes.video.value,
    extensions: FileTypes.video.extensions,
    accept: FileTypes.video.accept,
    maxSize: 1024 * 1000 * 100, // TODO get from Meteor.settings file
    usePartialResponse: true,
    converter: onServerExec(function () {
      import { videoConvert } from './converter/videoConvert'
      return videoConvert
    })
  }
}

// ///////////////////////////////////////////////////////////////////////////
//
// MATERIAL
//
// ///////////////////////////////////////////////////////////////////////////

VideoFiles.material = {
  noDefaultSchema: true,
  schema: {
    _id: {
      type: String,
      label: translateReactive('files.file'),
      autoform: {
        label: false,
        afFieldInput: {
          type: FilesTemplates.upload.type,
          uploadTemplate: FilesTemplates.upload.template,
          previewTemplate: 'videoFileRenderer',
          collection: VideoFiles.name,
          icon: VideoFiles.icon,
          maxSize: VideoFiles.files.maxSize,
          capture: VideoFiles.files.capture,
          accept: VideoFiles.files.accept// FileTypes.video.extensions.map(ext => `.${ext}`).join(',')
        }
      }
    }
  },
  renderer: {
    main: {
      name: 'preview',
      template: 'videoFileRenderer',
      load: async function () {
        return import('./renderer/main/videoFileRenderer')
      },
      previewData (targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        return targetId && getLocalCollection(VideoFiles.name).findOne(targetId)
      },
      data ({ materialDoc, document, options }) {
        const { preview = true, print = false, student = true } = options
        return Object.assign({}, {
          title: document.name,
          meta: name,
          preview: preview,
          print: print,
          student: student,
        }, document)
      }
    },
    list: {
      name: 'list',
      template: 'videoFilesListRenderer',
      load: async function () {
        return import('./renderer/list/videoFilesListRenderer')
      }
    }
  },
  async load () {
    await FilesTemplates.upload.load()
    await FilesTemplates.renderer.load()
    return import('../shared/templates/helpers')
  }
}

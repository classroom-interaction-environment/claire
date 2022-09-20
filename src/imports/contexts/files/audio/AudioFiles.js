import { FileTypes } from '../shared/FileTypes'
import { onServerExec } from '../../../api/utils/archUtils'
import { FilesTemplates } from '../FilesTemplates'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

export const AudioFiles = {
  name: 'audioFiles',
  label: 'files.audio',
  isFilesCollection: true,
  isCurriculum: true,
  isClassroom: true,
  debug: true,
  icon: 'file-audio',
  fieldName: 'audio',
  schema: {},
  methods: {},
  publicFields: {},
  dependencies: [],

  files: {
    type: FileTypes.audio.value,
    extensions: FileTypes.audio.extensions,
    accept: FileTypes.audio.accept,
    maxSize: 1024 * 1000 * 50,
    usePartialResponse: true,
    converter: onServerExec(function () {
      import { audioConvert } from './converter/audioConvert'
      return audioConvert
    })
  }
}

AudioFiles.material = {
  noDefaultSchema: true,
  schema: {
    _id: {
      type: String,
      label: AudioFiles.label,
      autoform: {
        label: false,
        afFieldInput: {
          type: FilesTemplates.upload.type,
          uploadTemplate: FilesTemplates.upload.template,
          previewTemplate: 'imageFileRenderer',
          collection: AudioFiles.name,
          icon: AudioFiles.icon,
          accept: AudioFiles.files.accept,
          maxSize: AudioFiles.files.maxSize,
          capture: AudioFiles.files.capture,
        }
      }
    }
  },
  renderer: {
    list: {
      template: 'audioFileListRenderer',
      load: async function () {
        return import('./renderer/list/audio')
      }
    },
    main: {
      template: 'audioFileRenderer',
      load: async function () {
        await import('../shared/templates/helpers')
        return import('./renderer/main/audioFileRenderer')
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
      },
      previewData (targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        return targetId && getLocalCollection(AudioFiles.name).findOne(targetId)
      }
    }
  },
  async load () {
    await FilesTemplates.upload.load()
    await FilesTemplates.renderer.load()
    return import('../shared/templates/helpers')
  }
}

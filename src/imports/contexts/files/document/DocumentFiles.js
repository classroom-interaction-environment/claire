import { FileTypes } from '../shared/FileTypes'
import { onServerExec } from '../../../api/utils/archUtils'
import { FilesTemplates } from '../FilesTemplates'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { AudioFiles } from '../audio/AudioFiles'

export const DocumentFiles = {
  name: 'documentFiles',
  label: 'files.documents',
  fieldName: 'documents',
  isFilesCollection: true,
  isCurriculum: true,
  isClassroom: true,
  icon: 'file-alt',
  schema: {},
  methods: {},
  publicFields: {},
  dependencies: [],

  files: {
    type: FileTypes.document.value,
    extensions: FileTypes.document.extensions,
    maxSize: 1024 * 1000 * 50,
    usePartialResponse: false,
    accept: FileTypes.document.accept,
    converter: onServerExec(function () {
      import { documentConverter } from './converter/documentConverter'
      return documentConverter
    })
  }
}

DocumentFiles.material = {
  noDefaultSchema: true,
  schema: {
    _id: {
      type: String,
      label: DocumentFiles.label,
      autoform: {
        label: false,
        afFieldInput: {
          type: FilesTemplates.upload.type,
          uploadTemplate: FilesTemplates.upload.template,
          previewTemplate: 'documentFileRenderer',
          collection: DocumentFiles.name,
          icon: AudioFiles.icon,
          maxSize: AudioFiles.files.maxSize,
          accept: FileTypes.document.accept // extensions.map(ext => `.${ext}`).join(',')
        }
      }
    }
  },
  renderer: {
    list: {
      template: 'documentFilesListRenderer',
      load: async function () {
        return import('./renderer/list/documentFilesListRenderer')
      }
    },
    main: {
      template: 'documentFileRenderer',
      load: async function () {
        await import('../shared/templates/helpers')
        return import('./renderer/main/documentFileRenderer')
      },
      data ({ materialDoc, document, options }) {
        const { preview = true, print = false, student = true } = options
        return Object.assign({}, {
          title: document.name,
          meta: name,
          preview: preview,
          print: print,
          student: student
        }, document)
      },
      previewData (targetId) {
        console.warn(this.name, 'previewData is deprecated!')
        return targetId && getLocalCollection(DocumentFiles.name).findOne(targetId)
      }
    }
  },
  async load () {
    await FilesTemplates.upload.load()
    await FilesTemplates.renderer.load()
    return import('../shared/templates/helpers')
  }
}

import { FileTypes } from '../shared/FileTypes'
import { FilesTemplates } from '../FilesTemplates'
import { onServerExec } from '../../../api/utils/archUtils'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

export const ImageFiles = {
  name: 'imageFiles',
  alias: 'imagefiles', // for backward-compatibility
  label: 'files.images',
  isFilesCollection: true,
  isCurriculum: true,
  isClassroom: true,
  isMaterial: true,
  debug: true,
  icon: 'file-image',
  fieldName: 'images',
  schema: {},
  methods: {},
  publicFields: {},
  dependencies: [],

  files: {
    type: FileTypes.image.value,
    extensions: FileTypes.image.extensions,
    accept: FileTypes.image.accept,
    maxSize: 1024 * 1000 * 6,
    usePartialResponse: false,
    converter: onServerExec(function () {
      import { imageConvert } from './converter/imageConvert'
      return imageConvert
    }),
    previewVersion: 'thumbnail'
  }
}

ImageFiles.material = {
  noDefaultSchema: true,
  schema: {
    _id: {
      type: String,
      label: ImageFiles.label,
      autoform: {
        label: false,
        afFieldInput: {
          type: FilesTemplates.upload.type,
          label: ImageFiles.label,
          previewTemplate: 'imageFileRenderer',
          collection: ImageFiles.name,
          icon: ImageFiles.icon,
          accept: ImageFiles.files.accept,
          maxSize: ImageFiles.files.maxSize,
          capture: ImageFiles.files.capture,
        }
      }
    }
  },
  renderer: {
    list: {
      template: 'imageFileListRenderer',
      load: async function () {
        return import('./renderer/list/imageFileListRenderer')
      },
      data: targetId => {
        return targetId && getLocalCollection(ImageFiles.name).findOne(targetId)
      }
    },
    main: {
      template: 'imageFileRenderer',
      load: async function () {
        return import('./renderer/main/imageFileRenderer')
      },
      /**
       * Composes the data for the renderer
       * @param materialDoc
       * @param document
       * @param templateInstance
       * @param options
       * @return {{preview: boolean, print: boolean, data: *, student: boolean, title}}
       */
      data (params = {}) {
        if (typeof params === 'string') {
          console.warn('ImagesFiles.data received a single id. Use { materialDoc, document, options } instead!')
          return this.previewData(params)
        }

        const { document } = params
        return document
      },
      /**
       * @deprecated use {data}
       * @param targetId
       * @return {any}
       */
      previewData (targetId) {
        console.warn(ImageFiles.name, 'previewData is deprecated!')
        return targetId && getLocalCollection(ImageFiles.name).findOne(targetId)
      }
    }
  },
  onCreated: function (imageId, unitDoc) {
    console.info(imageId, unitDoc)
  },
  async load () {
    await FilesTemplates.upload.load()
    await FilesTemplates.renderer.load()
    return import('../shared/templates/helpers')
  }
}
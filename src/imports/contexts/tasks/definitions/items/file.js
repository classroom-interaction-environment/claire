import { Files } from '../../../files/Files'
import { Item } from './Item'
import { ItemBase } from './base'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'
import { firstOption, editSchema, itemSchema } from '../common/helpers'
import { isMaterial } from '../../../material/isMaterial'
import { FilesTemplates } from '../../../files/FilesTemplates'

export const MediaItems = {
  name: 'mediaItems',
  label: 'itemTypes.media',
  icon: 'upload'
}

export const ItemFileSchema = {
  name: 'itemUpload',
  label: 'item.fileUpload',
  category: MediaItems,
  dataType: ResponseDataTypes.file.name,
  save: 'manual',
  edit ({ translate }) {
    return {
      fileType: {
        type: String,
        label: translate('item.fileType'),
        autoform: {
          hint: translate('item.hint.fileType'),
          firstOption: firstOption,
          options: Object.values(Files.all())
            .filter(entry => isMaterial(entry))
            .map(fileContext => ({
              value: fileContext.name,
              label: translate(fileContext.label)
            }))
        }
      },
      multiple: {
        type: Boolean,
        label: translate('files.multiple'),
        optional: true
      }
    }
  },
  item ({ lessonId, itemId, taskId, fileType, multiple, preview }, { translate }) {
    const ctx = Files.get(fileType)

    if (!fileType || !ctx) {
      console.warn(`No fileType or context => <${fileType}>`)
      return {
        [itemId]: {
          type: String
        }
      }
    }

    const fileLabel = ctx.label
    const fileUploadFieldDef = {
      type: String,
      label: () => {
        const base = translate('files.upload')()
        const details = translate(fileLabel)()
        return `${base} - ${details}`
      },
      autoform: {
        label: false,
        afFieldInput: {
          type: FilesTemplates.upload.type,
          uploadTemplate: FilesTemplates.upload.template,
          collection: fileType,
          previewRenderer: ctx.material.renderer.main,
          insertConfig: { meta: { itemId, taskId, lessonId } },
          accept: ctx.files.accept,
          maxSize: ctx.files.maxSize,
          capture: ctx.files.capture,
          preview: preview
        }
      }
    }

    if (multiple) {
      return {
        [itemId]: {
          type: Array,
          label: () => {
            const base = translate('files.uploadMultiple')()
            const details = translate(fileLabel)()
            return `${base} - ${details}`
          }
        },
        [`${itemId}.$`]: fileUploadFieldDef
      }
    }

    return { [itemId]: fileUploadFieldDef }
  }
}

Item.register(ItemFileSchema, {
  schema: editSchema(ItemBase, ItemFileSchema),
  build: itemSchema(ItemBase, ItemFileSchema)
})

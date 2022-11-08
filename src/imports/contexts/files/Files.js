import { FileTypes } from './shared/FileTypes'
import { FileSize } from './shared/SizeUnits'
import { createContextRegistry } from '../../infrastructure/datastructures/createContextRegistry'
import { auto, onClientExec, onServerExec } from '../../api/utils/archUtils'
import { ReactiveVar } from 'meteor/reactive-var'
import { isMaterial } from '../material/isMaterial'
import { FilesTemplates } from './FilesTemplates'

const filesMap = new Map()

export const Files = createContextRegistry({
  name: 'Files',
  map: filesMap,
  label: 'files.title',
  icon: 'file',
  types: FileTypes,
  sizeUnits: FileSize,
  setIdentity (context) {
    context.isFilesCollection = true
  },
  hasIdentity (context) {
    // todo check for context.files object properties
    // - type
    // - extensions
    // - accept
    // - maxSize
    // - converter
    return context.isFilesCollection === true && typeof context.files === 'object'
  }
})

Files.helpers = {}

Files.getMaterialContexts = auto(function () {
  import { isMaterial } from '../material/isMaterial'

  return function () {
    const contexts = []
    filesMap.forEach(ctx => {
      if (isMaterial(ctx)) contexts.push(ctx)
    })
    return contexts
  }
})


onClientExec(function () {
    import { ITaskDefinition } from '../tasks/definitions/ITaskDefinition'
  import { FilesTemplates } from './FilesTemplates'

  /** @deprecated move into own module FilesTemplates **/
  Files.templates = FilesTemplates

  /**
   * THis is the generic renderer, which itself is able to include
   * file-type-specific renderers for each registered files-type
   */
  Files.renderer = {
    template: 'fileRenderer',
    load: function () {
      return import('../../ui/renderer/files/fileRenderer')
    }
  }

  /**
   * Returns the upload schema for a given context.
   *
   * @param contextName
   * @param options
   * @return {{_id: {type: StringConstructor, label: boolean, autoform: {type: string, uploadTemplate: (Files.templates.upload|{type, template, load}), previewTemplate: *, collection: *, accept: (function(): *)}}}}
   */
  Files.schema = (contextName, options = {}) => {
    const { taskId, itemId, lessonId, unitId } = options
    const context = filesMap.get(contextName)

    if (!context) {
      throw new Error(`Unexpected files context "${contextName}"`)
    }

    return {
      _id: {
        type: String,
        label: false,
        autoform: {
          label: false,
          afFieldInput: {
            type: FilesTemplates.upload.type,
            label: context.label,
            icon: context.icon,
            uploadTemplate: FilesTemplates.upload.template,
            previewTemplate: context.material.renderer.main.template,
            collection: context.name,
            accept: context.files.accept,
            maxSize: context.files.maxSize,
            capture: context.files.capture,
            insertConfig: {
              meta: {
                taskId, itemId, lessonId, unitId
              }
            }
          }
        }
      }
    }
  }

  Files.helpers.getRenderer = function (name) {
    const context = filesMap.get(name)
    return (context && context.material.renderer)
      ? context.material.renderer.main
      : Files.templates.renderer
  }

  const initialized = new ReactiveVar()

  async function init (autoLoadContexts) {
    if (autoLoadContexts) {
      const { ImageFiles } = await import('./image/ImageFiles')
      const { AudioFiles } = await import('./audio/AudioFiles')
      const { DocumentFiles } = await import('./document/DocumentFiles')
      const { VideoFiles } = await import('./video/VideoFiles')

      filesMap.set(ImageFiles.name, ImageFiles)
      filesMap.set(AudioFiles.name, AudioFiles)
      filesMap.set(VideoFiles.name, VideoFiles)
      filesMap.set(DocumentFiles.name, DocumentFiles)
    }

    await FilesTemplates.upload.load()
    await FilesTemplates.renderer.load()
    await import('./shared/templates/helpers')

    // TODO load plugins here
    return true
  }

  Files.isInitialized = () => initialized.get()

  /**
   * @deprecated extract into external method
   * @param initContexts
   */
  Files.initialize = function (initContexts) {
    if (initialized.get()) {
      return initialized
    }

    init(!!initContexts)
      .then(res => {
        console.warn(filesMap)
        if (typeof initContexts === 'function') {
          const materialContexts = Files.getMaterialContexts()
          initContexts(materialContexts)
        }
        initialized.set(res)
      })
      .catch(e => console.error(e))

    return initialized
  }

  ITaskDefinition(Files, filesMap)
})

onServerExec(function () {
  import { nullConverter } from './shared/converters/nullConverter'

  Files.helpers.getConverter = function (name) {
    const context = filesMap.get(name)
    return (context && context.converter)
      ? context.converter
      : nullConverter
  }
})

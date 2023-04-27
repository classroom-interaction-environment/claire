import { Files } from './Files'
import { FilesDefaults } from './FilesDefaults'
import { getAllSchema } from '../../api/utils/getAllSchema'
import { createEditorPublication } from '../../api/decorators/publications/createEditorPublication'
import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { createSetStateMethod } from '../../api/decorators/methods/files/createSetStateMethod'
import { createMyFilesPublication } from '../../api/decorators/publications/files/createMyFilesPublication'
import { createFilesByItemPublication } from '../../api/decorators/publications/files/createFilesByItemPublication'
import { createDeleteFile } from '../../api/decorators/methods/files/createDeleteFile'
import { createEditorGetMethod } from '../../api/decorators/methods/createEditorGetMethod'
import { createMyMethod } from '../../api/decorators/methods/createMyMethod'
import { createUploadPublication } from '../../api/decorators/publications/files/createUploadPublication'

export const filesPipeline = createPipeline(Files.name, function (filesContext, api) {
  filesContext.schema = Object.assign({}, filesContext.schema, FilesDefaults.schema())
  filesContext.publicFields = Object.assign({}, filesContext.publicFields, FilesDefaults.fields())
  filesContext.methods = filesContext.methods || {}
  filesContext.methods.setMasterState = createSetStateMethod(filesContext, { type: 'master' })
  filesContext.methods.setCustomState = createSetStateMethod(filesContext, { type: 'custom' })
  filesContext.methods.editor = createEditorGetMethod(filesContext)
  filesContext.methods.my = createMyMethod(filesContext)
  filesContext.methods.remove = createDeleteFile({ filesContext, api })

  // overrides the existing files
  const editorPublications = createEditorPublication({
    name: filesContext.name,
    publicFields: filesContext.publicFields,
    schema: Object.assign({}, getAllSchema, {
      _master: {
        type: Boolean,
        optional: true
      },
      meta: {
        type: Object,
        optional: true
      },
      'meta.unitId': {
        type: String,
        optional: true
      },
      'meta.lessonId': {
        type: String,
        optional: true
      },
      'meta.taskId': {
        type: String,
        optional: true
      },
      'meta.itemId': {
        type: String,
        optional: true
      }
    })
  })

  const myFiles = createMyFilesPublication(filesContext)
  const items = createFilesByItemPublication(filesContext)
  const upload = createUploadPublication(filesContext)

  filesContext.publications = Object.assign({},
    editorPublications,
    myFiles,
    items,
    upload,
    filesContext.publications)

  if (!Files.has(filesContext.name)) {
    Files.add(filesContext)
  }
})

import { createCurriculumPublications } from '../../api/decorators/publications/createCurriculumPublications'
import { Defaults } from '../../api/defaults/Defaults'
import { getAllSchema } from '../../api/utils/getAllSchema'
import { createEditorPublication } from '../../api/decorators/publications/createEditorPublication'
import { createMyPublication } from '../../api/decorators/publications/createMyPublication'
import { Curriculum } from '../../contexts/curriculum/Curriculum.js'
import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { isFilesContext } from '../files/isFilesContext'
import { createEditorGetMethod } from '../../api/decorators/methods/createEditorGetMethod'
import { Schema } from '../../api/schema/Schema'
import { createInsert } from '../../api/decorators/methods/createInsert'
import { UserUtils } from '../system/accounts/users/UserUtils'
import { createUpdate } from '../../api/decorators/methods/createUpdate'
import { createRemove } from '../../api/decorators/methods/createRemove'
import { createFindOne } from '../../api/decorators/methods/createFindOne'
import { createGetAll } from '../../api/decorators/methods/createGetAll'
import { createMyMethod } from '../../api/decorators/methods/createMyMethod'
import { createGetMaster } from '../../api/decorators/methods/createGetMaster'

const assignSchema = (expected, fallback = {}) => Object.assign({}, Schema.getDefault(), (expected || fallback))
const curriclumSchema = {
  _master: {
    type: Boolean,
    optional: true
  }
}

export const curriculumPipeline = createPipeline(Curriculum.name, function (context) {
  Curriculum.setIdentity(context)

  // CREATING SCHEMA
  const defaultSchema = Curriculum.getDefaultSchema(isFilesContext(context))
  context.schema = Object.assign({}, defaultSchema, context.schema)
  context.publicFields = Object.assign({}, Defaults.fields(), Curriculum.getDefaultPublicFields(), context.publicFields) // TODO why not curriculum.getDefaultFields() ?

  // CREATING METHODS
  const curriculumMethods = {}
  const options = {
    name: context.name,
    schema: assignSchema(context.schema, curriclumSchema),
    roles: UserUtils.roles.teacher,
    isCurriculum: true
  }

  curriculumMethods.get = createFindOne(options)
  curriculumMethods.all = createGetAll(options)
  curriculumMethods.insert = createInsert(options)
  curriculumMethods.update = createUpdate(options)
  curriculumMethods.remove = createRemove(options)
  curriculumMethods.editor = createEditorGetMethod(options)
  curriculumMethods.my = createMyMethod(context)
  curriculumMethods.master = createGetMaster(context)

  // finally assign but respect original methods
  context.methods = Object.assign(curriculumMethods, context.methods)

  // CREATING PUBLICATIONS
  const curriculumPublications = createCurriculumPublications({
    name: context.name,
    schema: getAllSchema,
    publicFields: context.publicFields
  })

  const editorPublications = createEditorPublication({
    name: context.name,
    schema: getAllSchema,
    publicFields: context.publicFields
  })

  const myPublications = createMyPublication({
    name: context.name,
    publicFields: context.publicFields
  })

  // merge all publictions into one
  context.publications = Object.assign({}, curriculumPublications, editorPublications, { my: myPublications }, context.publications)
  Curriculum.add(context)
})

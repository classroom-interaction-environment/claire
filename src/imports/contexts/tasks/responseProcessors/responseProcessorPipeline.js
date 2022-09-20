import { createPipeline } from '../../../infrastructure/pipelines/createPipeline'
import { createByLessonPublication } from '../../../api/decorators/publications/createByLessonPublication'
import { createItemGetMethod } from '../../../api/decorators/methods/createItemGetMethod'
import { createByItemPublication } from '../../../api/decorators/publications/createByItemPublication'
import { createResponseProcessorSaveMethod } from '../../../api/decorators/methods/createResponseProcessorSaveMethod'

const baseSchema = () => ({ lessonId: String, taskId: String, itemId: String })
const withBaseSchema = schema => Object.assign({}, baseSchema(), schema)

export const responseProcessorPipeline = createPipeline('ResponseProcessors', function (context, api) {
  // if the context is not intended to "save" any results
  // we simply skip creating any methods or publications
  if (!context.schema) {
    return api.info('> no data layer defined, skip')
  }

  // create collection
  context.schema = withBaseSchema(context.schema)

  // create methods
  const methods = {}
  methods.save = createResponseProcessorSaveMethod(context)
  methods.get = createItemGetMethod(context)
  context.methods = Object.assign({}, methods, context.methods)

  context.publications = context.publications || {}
  context.publications.byLesson = createByLessonPublication(context)
  context.publications.byItem = createByItemPublication(context)
})

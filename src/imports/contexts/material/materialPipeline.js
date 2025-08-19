import { Material } from './Material'
import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { createPreviewMethod } from '../../api/decorators/methods/createPreviewMethod'

export const materialPipeline = createPipeline(Material.name, function (context) {
  if (context.material.isPreviewable) {
    context.methods = context.methods || {}
    context.methods.preview = context.methods.preview || createPreviewMethod(context)
  }
})

import { Material } from './Material'
import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { createPreviewMethod } from '../../api/decorators/methods/createPreviewMethod'

export const materialPipeline = createPipeline(Material.name, function (context) {
  console.debug('MATERIAL PIPELINE')
  if (context.material.isPreviewable) {
    console.debug('previewable', context)
    context.methods = context.methods || {}
    context.methods.preview = context.methods.preview || createPreviewMethod(context)
  }
})

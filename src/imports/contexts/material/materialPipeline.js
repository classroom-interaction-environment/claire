import { createPipeline } from '../../infrastructure/pipelines/createPipeline'
import { Material } from './Material'

export const materialPipeline = createPipeline(Material.name, function (context) {
  // TODO items contexts / publications here?
})

import { System } from './System'
import { createPipeline } from '../../infrastructure/pipelines/createPipeline'

export const systemPipeline = createPipeline(System.name, function (context, api) {
  System.setIdentity(context)
  System.add(context)
})

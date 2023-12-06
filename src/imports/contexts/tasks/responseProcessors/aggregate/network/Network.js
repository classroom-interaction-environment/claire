import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

export const Network = {
  name: 'render',
  label: 'responseProcessors.render.title',
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.textList.name],
  isResponseProcessor: true,
  icon: 'cubes',
  schema: {},
  helpers: {},
  renderer: {
    template: 'rpNetwork',
    load: async function load () {
      return import('./renderer/network')
    }
  }
}

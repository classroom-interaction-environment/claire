import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

export const RawResponse = {
  name: 'rawResponse',
  label: 'responseProcessors.raw',
  icon: 'database',
  dataTypes: [ResponseDataTypes.rawResponse.name],
  renderer: {
    template: 'itemResultRawData',
    async load () {
      return import('./itemResultRawData')
    }
  }
}

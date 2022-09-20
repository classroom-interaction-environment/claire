import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import { FileTypes } from '../../../../files/shared/FileTypes'

export const DocumentList = {
  name: 'documentList',
  label: 'responseProcessors.documentList',
  icon: 'file',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.file.name],
  fileType: FileTypes.document.value,
  renderer: {
    template: 'documentResultsRenderer',
    async load () {
      return import('./documentResultsRenderer')
    }
  }
}
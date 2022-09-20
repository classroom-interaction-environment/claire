import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import { FileTypes } from '../../../../files/shared/FileTypes'

export const AudioList = {
  name: 'audioList',
  label: 'responseProcessors.audioList',
  icon: 'file-audio',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.file.name],
  fileType: FileTypes.audio.value,
  renderer: {
    template: 'audioResultsRenderer',
    async load () {
      return import('./audioResultsRenderer')
    }
  }
}

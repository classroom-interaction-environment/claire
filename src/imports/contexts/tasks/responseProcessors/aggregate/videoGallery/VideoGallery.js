import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import { FileTypes } from '../../../../files/shared/FileTypes'

export const VideoGallery = {
  name: 'videoGallery',
  label: 'responseProcessors.videoGallery',
  icon: 'file-video',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.file.name],
  fileType: FileTypes.video.value,
  renderer: {
    template: 'videoResultsRenderer',
    async load () {
      return import('./videoResultsRenderer')
    }
  }
}

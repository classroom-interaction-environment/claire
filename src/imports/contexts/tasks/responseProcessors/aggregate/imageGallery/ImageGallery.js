import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import { FileTypes } from '../../../../files/shared/FileTypes'

export const ImageGallery = {
  name: 'imageGallery',
  label: 'responseProcessors.imageGallery',
  icon: 'file-image',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.file.name],
  fileType: FileTypes.image.value,
  renderer: {
    template: 'imageResultsRenderer',
    async load () {
      return import('./imageResultsRenderer')
    }
  }
}

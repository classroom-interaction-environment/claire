import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

export const GroupText = {
  name: 'responseGroupText',
  label: 'responseProcessors.groupText',
  isResponseProcessor: true,
  isGroupMode: true,
  icon: 'layer-group',
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.text.name],
  renderer: {
    template: 'itemResultGroupText',
    async load () {
      return import('./itemResultGroupText')
    }
  },
  schema: {
    visibleUsers: {
      type: Array,
      optional: true
    },
    'visibleUsers.$': String,
    hiddenAnswers: {
      type: Array,
      optional: true
    },
    'hiddenAnswers.$': String
  }
}

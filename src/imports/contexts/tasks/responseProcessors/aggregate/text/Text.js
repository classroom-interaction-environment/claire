import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

// TODO rename to SimpleText

export const Text = {
  name: 'responseText',
  label: 'responseProcessors.text',
  isResponseProcessor: true,
  icon: 'align-justify',
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.text.name],
  renderer: {
    template: 'itemResultText',
    async load () {
      return import('./itemResultText')
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

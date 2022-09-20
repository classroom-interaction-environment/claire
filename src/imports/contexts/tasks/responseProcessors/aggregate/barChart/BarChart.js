import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

export const BarChart = {
  name: 'responseBarChart',
  label: 'responseProcessors.barChart',
  icon: 'chart-bar',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [
    ResponseDataTypes.dichotome.name,
    ResponseDataTypes.numerical.name,
    ResponseDataTypes.singleChoice.name,
    ResponseDataTypes.multipleChoice.name
  ],
  renderer: {
    template: 'rpBarChart',
    async load () {
      return import('./rpBarChart')
    }
  }
}

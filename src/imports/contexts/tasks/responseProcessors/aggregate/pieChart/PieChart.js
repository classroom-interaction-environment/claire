import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'

export const PieChart = {
  name: 'pieChart',
  label: 'responseProcessors.pieChart',
  icon: 'chart-pie',
  isResponseProcessor: true,
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [
    ResponseDataTypes.singleChoice.name,
    ResponseDataTypes.multipleChoice.name,
    ResponseDataTypes.numerical.name,
    ResponseDataTypes.dichotome.name
  ],
  renderer: {
    template: 'rpPieChart',
    load: async function () {
      return import('./rpPieChart')
    }
  }
}

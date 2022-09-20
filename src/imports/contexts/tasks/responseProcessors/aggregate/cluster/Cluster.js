import { ResponseProcessorTypes } from '../../ResposeProcessorTypes'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'

export const Cluster = {
  name: 'cluster',
  label: 'responseProcessors.cluster.title',
  type: ResponseProcessorTypes.aggregate.name,
  dataTypes: [ResponseDataTypes.textList.name],
  isResponseProcessor: true,
  icon: 'cubes',
  schema: {
    width: Number,
    height: Number,
    quadrants: {
      type: Array,
      optional: true
    },
    'quadrants.$': Object,
    'quadrants.$.name': String,
    'quadrants.$.color': String,
    elements: Array,
    'elements.$': Object,
    'elements.$.id': String,
    'elements.$.x': {
      type: Number,
      optional: true
    },
    'elements.$.y': {
      type: Number,
      optional: true
    },
    'elements.$.c': {
      type: String,
      optional: true
    },
    'elements.$.w': {
      type: String,
      optional: true
    },
    'elements.$.h': {
      type: String,
      optional: true
    }
  },
  helpers: {},
  renderer: {
    template: 'rpCluster',
    load: async function load () {
      return import('./renderer/cluster')
    }
  }
}

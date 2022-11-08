import { getCollection } from '../../../../api/utils/getCollection'
import { firstOption } from '../../../tasks/definitions/common/helpers'
import { reactive } from '../../../../api/routes/reactive'
import { iife } from '../../../../api/utils/iife'

export const Objective = {
  name: 'objective',
  order: 4,
  isMeta: true,
  isCurriculum: true,
  isClassroom: true,
  fieldName: 'objectives',
  label: 'curriculum.objective',
  icon: 'mortar-board',
  schema: {
    index: {
      type: String,
      label: reactive('common.index'),
      optional: false
    },
    parent: {
      type: String,
      label: reactive('common.parent'),
      optional: true,
      autoform: {
        firstOption: firstOption,
        options: iife(() => {
          const query = {}
          const trans = { sort: { index: 1 } }
          const toOption = doc => ({ value: doc._id, label: `${doc.index} - ${doc.title}` })
          return () => getCollection(Objective.name).find(query, trans).map(toOption)
        })
      }
    },
    deprecated: {
      type: Boolean,
      optional: true,
      label: reactive('common.deprecated')
    }
  },
  publicFields: {
    index: 1,
    parent: 1
  },
  methods: {},
  dependencies: [],
  publications: {}
}

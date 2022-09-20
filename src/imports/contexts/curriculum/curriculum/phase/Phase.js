import { SocialStateType } from '../types/SocialStateType'
import { firstOption } from '../../../tasks/definitions/common/helpers'
import { onServerExec } from '../../../../api/utils/archUtils'
import { translateReactive } from '../../../../utils/translateReactive'
import { getCollection } from '../../../../api/utils/getCollection'

export const Phase = {
  name: 'phase',
  order: 2,
  label: 'curriculum.phase',
  icon: 'table',
  isCurriculum: true,
  isClassroom: true,
  fieldName: 'phases',
  methods: {},
  schema: {
    // ////////////////////////////////////////////////////////
    //
    // REQUIRED
    //
    // ///////////////////////////////////////////////////////
    period: {
      type: Number,
      label: translateReactive('curriculum.period'),
      min: 1
    },

    // ////////////////////////////////////////////////////////
    //
    // OPTIONAL
    //
    // ////////////////////////////////////////////////////////
    unit: {
      type: String,
      optional: true,
      label: translateReactive('curriculum.unit'),
      autoform: {
        firstOption: firstOption,
        options () {
          import { Unit } from '../unit/Unit'
          const UnitCollection = getCollection(Unit.name)
          return UnitCollection.find().map(doc => ({
            value: doc._id,
            label: doc.title
          }))
        }

        // FormFactory.getSelectOptions(Unit.name, {}, { value: '_id', label: 'title' })
      }
    },
    plot: {
      type: String,
      label: translateReactive('phase.plot'),
      optional: true,
      autoform: {
        type: 'textarea',
        rows: 10,
        class: 'plot'
      }
    },
    socialState: {
      type: Array,
      optional: true,
      label: translateReactive('curriculum.socialState'),
      minCount: 1,
      displayType: 'array'
    },
    'socialState.$': {
      type: SocialStateType.TYPE,
      label: translateReactive('curriculum.socialState'),
      autoform: {
        firstOption: firstOption,
        options () {
          return Object.values(SocialStateType.entries)
        }
      }
    },
    method: {
      label: translateReactive('curriculum.method'),
      type: String,
      optional: true
    },
    references: {
      optional: true,
      type: Array,
      label: translateReactive('unit.references'),
      displayType: 'array'
    },
    'references.$': {
      type: Object,
      label: translateReactive('common.entry')
    },
    'references.$.collection': {
      type: String,
      label: translateReactive('common.collection'),
      // autoform added in respective view
    },
    'references.$.document': {
      type: String,
      label: translateReactive('common.document'),
      // autoform added in respective view
    },

    notes: {
      type: String,
      optional: true,
      label: translateReactive('common.notes'),
      autoform: {
        type: 'textarea',
        rows: 6,
        class: 'notes'
      }
    }
  },
  publicFields: {
    unit: 1,
    period: 1,
    socialState: 1,
    method: 1,
    plot: 1,
    references: 1,
    notes: 1
  },
  material: {}
}

Phase.methods.byUnitId = {
  name: 'phase.methods.byUnitId',
  schema: { unitId: String },
  run: onServerExec(function () {
    import { phasesByUnitId } from './phasesByUnitId'

    return function ({ unitId }) {
      return phasesByUnitId(unitId)
    }
  })
}

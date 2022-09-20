import { DimensionType } from '../types/DimensionType'
import { firstOption } from '../../../tasks/definitions/common/helpers'
import { reactive } from '../../../../api/routes/reactive'

export const Dimension = {
  name: 'dimension',
  order: 5,
  isMeta: true,
  isCurriculum: true,
  isClassroom: true,
  label: 'curriculum.dimension',
  fieldName: 'dimensions',
  icon: 'cube',
  schema: {
    type: {
      label: reactive('common.type'),
      type: Number,
      displayType: 'string',
      resolve (value) {
        if (value === 0) return DimensionType.entries.ACTOR.label()
        if (value === 1) return DimensionType.entries.LAYER.label()
        return value
      },
      autoform: {
        afFieldInput: {
          firstOption: firstOption(),
          options: Object.values(DimensionType.entries).map(option => {
            const copy = { ...option }
            copy.label = reactive(copy.label)
            return copy
          })
        }
      }
    },
    color: {
      type: String,
      label: reactive('common.colorCode'),
      displayType: 'color',
      resolve (value) { return value },
      autoform: {
        type: 'color',
        defaultValue: () => {
          const intVal = Math.random() * 0xffffff
          const strVal = Number.parseInt(intVal, 10).toString(16)
          return `#${strVal}`
        }
      }
    }
  },
  publicFields: {
    type: 1,
    color: 1
  },
  methods: {},
  publications: {},
  typeResolver: DimensionType,
  filter: {
    schema: {
      type: {
        type: Number,
        optional: true
      }
    }
  }
}

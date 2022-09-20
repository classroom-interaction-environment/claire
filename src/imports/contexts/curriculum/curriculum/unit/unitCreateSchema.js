import { Unit } from './Unit'
import { translateReactive } from '../../../../utils/translateReactive'
import { firstOption } from '../../../tasks/definitions/common/helpers'
import { dimensionOptions } from '../dimension/dimensionOptions'

/**
 * returns a default schema to create a new Unit, which is used by many pages
 * @param DimensonCollection {Mongo.Collection} optional, inject from outside to decide between local or synced
 * @param custom {boolean} define, whether this schema is intended for creating custom units
 * @return {object}
 */
export const unitCreateSchema = ({ DimensionCollection, custom } = {}) => {
  const schema = {
    title: {
      type: String,
      label: translateReactive('common.title')
    },
    index: Unit.schema.index,
    pocket: Unit.schema.pocket,
    period: Unit.schema.period
  }

  // if this should be a custom unit then we need a different
  // schema setup for pocket and also add the _custom flag

  if (custom) {
    schema._custom = {
      type: Boolean,
      defaultValue: true,
      autoform: {
        defaultValue: true,
        type: 'hidden'
      }
    }
    schema.pocket = {
      type: String,
      defaultValue: '__custom__',
      autoform: {
        defaultValue: '__custom__',
        type: 'hidden'
      }
    }
  }

  else {
    schema.pocket = Unit.schema.pocket
  }

  if (DimensionCollection) {
    Object.assign(schema, {
      dimensions: Unit.schema.dimensions,
      'dimensions.$': {
        ...Unit.schema['dimensions.$'],
        ...{
          autoform: {
            firstOption: firstOption,
            options: dimensionOptions({ collection: DimensionCollection })
          }
        }
      }
    })
  }

  return schema
}

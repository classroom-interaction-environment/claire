import { Item } from './Item'
import { ItemBase } from './base'
import { editSchema, itemSchema } from '../common/helpers'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'

export const NumericalItems = {
  name: 'numericalItems',
  label: 'itemTypes.numerical',
  icon: 'sliders-h',
  base: 'itemNumber'
}

export const ItemNumber = {
  name: 'itemNumber',
  label: 'item.number',
  icon: 'chart-line',
  save: 'manual',
  category: NumericalItems,
  dataType: ResponseDataTypes.numerical.name,
  edit ({ translate }) {
    return {
      minValue: {
        label: translate('form.minValue'),
        type: Number,
        optional: true
      },
      maxValue: {
        type: Number,
        label: translate('form.maxValue'),
        optional: true
      }
    }
  },
  item ({ itemId, minValue, maxValue }) {
    return {
      [itemId]: {
        type: Number,
        autoform: {
          type: 'number'
        },
        min: minValue,
        max: maxValue
      }
    }
  }
}

Item.register(ItemNumber, {
  schema: editSchema(ItemBase, ItemNumber),
  build: itemSchema(ItemBase, ItemNumber)
})

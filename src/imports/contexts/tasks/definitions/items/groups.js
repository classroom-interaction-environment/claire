import { Item } from './Item'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'
import { editSchema, firstOption, itemSchema } from '../common/helpers'
import { ItemBase } from './base'

export const GroupItems = {
  name: 'groupItems',
  label: 'itemTypes.group',
  icon: 'users',
  base: 'groupText'
}

Item.categories.set(GroupItems.name, GroupItems)

export const GroupText = {
  name: 'groupText',
  category: GroupItems,
  label: 'item.groupText',
  dataType: ResponseDataTypes.text.name,
  icon: 'layer-group',
  edit ({ translate }) {
    return {
      groupMode: {
        type: String,
        optional: false,
        label: translate('item.groupMode.title'),
        allowedValues: ['override', 'merge'],
        autoform: {
          firstOption: firstOption,
          options: () => [
            { value: 'override', label: translate('item.groupMode.override') },
            { value: 'merge', label: translate('item.groupMode.merge') }
          ]
        }
      },
      rows: {
        type: Number,
        label: translate('form.rows'),
        optional: true
      },
      placeholder: {
        type: String,
        label: translate('form.placeholder'),
        optional: true
      },
      maxChars: {
        type: Number,
        label: translate('form.maxChars'),
        optional: true,
        defaultValue: 1000
      },
      minChars: {
        type: Number,
        label: translate('form.minChars'),
        optional: true,
        min: 0
      }
    }
  },
  item ({ itemId, maxChars, minChars, rows, forbiddenChars, placeholder }) {
    return {
      [itemId]: {
        max: maxChars,
        min: minChars,
        type: String,
        autoform: {
          type: 'groupText',
          placeholder: placeholder,
          rows: rows || 10
          // TODO forbiddenChars -> regex evluate
        }
      }
    }
  },
  load: () => import('../forms/groupText/groupText')
}

Item.register(GroupText, {
  schema: editSchema(ItemBase, GroupText),
  build: itemSchema(ItemBase, GroupText)
})

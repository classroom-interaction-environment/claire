import { Random } from 'meteor/random'
import { Features } from '../../../../api/config/Features'

export const ItemBase = {
  name: 'itemBase',
  edit ({ translate }) {
    const baseSchema = {
      itemId: {
        type: String,
        autoform: {
          type: 'hidden',
          defaultValue: () => Random.id()
        }
      },
      title: {
        type: String,
        label: translate('common.title'),
        autoform: {
          hint: translate('item.hint.title'),
          afFieldInput: {
            autofocus: ''
          }
        }
      },
      label: {
        type: String,
        label: translate('item.label'),
        autoform: {
          hint: translate('item.hint.label')
        }
      },
      required: {
        type: Boolean,
        label: translate('form.required'),
        defaultValue: true,
        optional: true,
        autoform: {
          hint: translate('item.hint.required')
        }
      }
    }
    if (Features.get('groups')) {
      baseSchema.groupMode = {
        type: String,
          optional: true,
          label: translate('item.groupMode.title'),
          defaultValue: 'off',
          allowedValues: ['off', 'split', 'override'],
          autoform: {
          defaultValue: 'off',
            options: () => [
            { value: 'off', label: translate('item.groupMode.off') },
            { value: 'split', label: translate('item.groupMode.split') },
            { value: 'override', label: translate('item.groupMode.override') },
            { value: 'merge', label: translate('item.groupMode.merge'), disabled: true }
          ]
        }
      }
    }
    return baseSchema
  },
  item ({ itemId, label, required }) {
    return {
      [itemId]: {
        type: String,
        label: label,
        optional: !required
      }
    }
  }
}

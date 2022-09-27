import { Item } from './Item'
import { ItemBase } from './base'
import { editSchema, itemLoad, itemSchema } from '../common/helpers'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'

export const TextItems = {
  name: 'textItems',
  label: 'itemTypes.text',
  icon: 'align-left',
  base: 'itemText'
}

Item.categories.set(TextItems.name, TextItems)

export const ItemText = {
  name: 'itemText',
  category: TextItems,
  label: 'item.text',
  dataType: ResponseDataTypes.text.name,
  icon: 'align-left',
  edit ({ translate }) {
    return {
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
  item ({ itemId, maxChars, minChars, forbiddenChars, placeholder }) {
    return {
      [itemId]: {
        max: maxChars,
        min: minChars,
        type: String,
        autoform: {
          type: 'text',
          placeholder: placeholder
          // TODO forbiddenChars -> regex evluate
        }
      }
    }
  }
}

Item.register(ItemText, {
  schema: editSchema(ItemBase, ItemText),
  build: itemSchema(ItemBase, ItemText)
})

export const ItemTags = {
  name: 'itemTags',
  label: 'item.tags',
  category: TextItems,
  icon: 'tags',
  dataType: ResponseDataTypes.textList.name,
  edit ({ translate }) {
    return {
      // uncommented in order to check with other, whether this
      // is still required
      /*
      onlyOptions: {
        label: translate('form.onlyOptions'),
        type: Boolean,
        defaultValue: false,
        optional: true
      },
      options: {
        type: Array,
        label: translate('form.options'),
        optional: true
      },
      'options.$': {
        label: translate('form.entry'),
        type: String
      },
      */
      minCount: {
        type: Number,
        label: translate('form.minCount'),
        optional: true,
        defaultValue: 1
      },
      maxCount: {
        type: Number,
        label: translate('form.maxCount'),
        optional: true
      },
      minChars: {
        type: Number,
        label: translate('form.minChars'),
        optional: true,
        defaultValue: 3
      },
      maxChars: {
        type: Number,
        label: translate('form.maxChars'),
        optional: true,
        defaultValue: 50
      }
    }
  },
  item ({ itemId, onlyOptions, options, minCount, maxCount, minChars, maxChars }) {
    return {
      [itemId]: {
        type: Array,
        autoform: {
          type: 'tags',
          onlyOptions,
          options: () => options,
          minCount: minCount,
          maxCount: maxCount,
          minChars: minChars,
          maxChars: maxChars
        }
      },
      [`${itemId}.$`]: {
        type: String
      }
    }
  },
  load: async () => {
    const AFTags = (await import('meteor/jkuester:autoform-tags')).default
    await AFTags.load()
  }
}

Item.register(ItemTags, {
  schema: editSchema(ItemBase, ItemTags),
  build: itemSchema(ItemBase, ItemTags),
  load: itemLoad(ItemBase, ItemTags)
})

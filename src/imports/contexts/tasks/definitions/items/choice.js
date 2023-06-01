import { Item } from './Item'
import { editSchema, firstOption, itemSchema } from '../common/helpers'
import { ItemBase } from './base'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'

export const ChoiceItems = {
  name: 'choiceItems',
  label: 'itemTypes.choices',
  icon: 'check-square',
  base: 'itemSingleSelect'
}

export const ItemChoices = {
  name: 'itemSingleSelect',
  label: 'item.singleSelect',
  icon: 'chart-pie',
  save: 'auto',
  category: ChoiceItems,
  dataType: ResponseDataTypes.singleChoice.name,
  edit ({ translate }) {
    return {
      choices: {
        type: Array,
        label: translate('form.choices')
      },
      'choices.$': {
        label: translate('form.entry'),
        type: String
      },
      defaultChoice: {
        type: String,
        label: translate('form.defaultValue'),
        optional: true,
        autoform: {
          hint: translate('item.hint.defaultChoice'),
          disabled () {
            const currentChoices = global.AutoForm.getFieldValue('choices')
            return !currentChoices || currentChoices.length === 0
          },
          firstOption: firstOption,
          options () {
            const currentChoices = global.AutoForm.getFieldValue('choices') || []
            return currentChoices.map(choice => ({
              value: choice,
              label: choice
            }))
          }
        }
      }
    }
  },
  item ({ itemId, choices, defaultChoice }) {
    return {
      [itemId]: {
        type: String,
        autoform: {
          type: 'select',
          defaultValue: defaultChoice,
          firstOption: firstOption,
          options: () => choices.map(choice => ({
            value: choice,
            label: choice
          }))
        }
      }
    }
  }
}

Item.register(ItemChoices, {
  schema: editSchema(ItemBase, ItemChoices),
  build: itemSchema(ItemBase, ItemChoices)
})

export const getOrientations = translate => ({
  horizontal: {
    value: 'h',
    label: translate('orientation.h')
  },
  vertical: {
    value: 'v',
    label: translate('orientation.v')
  }
})

export const ItemRadio = {
  name: 'itemSingleChoice',
  label: 'item.singleChoice',
  icon: 'chart-pie',
  save: 'auto',
  category: ChoiceItems,
  dataType: ResponseDataTypes.singleChoice.name,
  edit ({ translate }) {
    const orientations = getOrientations(translate)
    return {
      orientation: {
        type: String,
        label: translate('orientation.title'),
        defaultValue: orientations.vertical.value,
        optional: true,
        autoform: {
          firstOption: false,
          options: () => Object.values(orientations)
        }
      }
    }
  },
  item ({ itemId, orientation }, { translate }) {
    const orientations = getOrientations(translate)
    return {
      [itemId]: {
        autoform: {
          noselect: true,
          type: (orientation === orientations.vertical.value) ? 'select-radio' : 'select-radio-inline'
        }
      }
    }
  }
}

Item.register(ItemRadio, {
  schema: editSchema(ItemBase, ItemChoices, ItemRadio),
  build: itemSchema(ItemBase, ItemChoices, ItemRadio)
})

export const ItemCheckBox = {
  name: 'itemMultipleChoice',
  label: 'item.multipleChoice',
  icon: 'chart-bar',
  dataType: ResponseDataTypes.multipleChoice.name,
  category: ChoiceItems,
  edit ({ translate }) {
    const orientations = getOrientations(translate)
    return {
      orientation: {
        type: String,
        optional: true,
        label: translate('orientation.title'),
        defaultValue: orientations.vertical.value,
        autoform: {
          firstOption: false,
          options: () => Object.values(orientations)
        }
      }
    }
  },
  item ({ itemId, orientation }, { translate }) {
    const orientations = getOrientations(translate)
    return {
      [itemId]: {
        type: Array,
        autoform: {
          noselect: true,
          type: orientation === orientations.vertical.value ? 'select-checkbox' : 'select-checkbox-inline'
        }
      },
      [`${itemId}.$`]: {
        type: String
      }
    }
  }
}

Item.register(ItemCheckBox, {
  schema: editSchema(ItemBase, ItemChoices, ItemCheckBox),
  build: itemSchema(ItemBase, ItemChoices, ItemCheckBox)
})

export const ItemSelectMultiple = {
  name: 'itemMultipleSelect',
  label: 'item.multipleSelect',
  dataType: ResponseDataTypes.multipleChoice.name,
  icon: 'chart-bar',
  category: ChoiceItems,
  edit () {
    return {}
  },
  item ({ itemId }) {
    return {
      [itemId]: {
        type: Array,
        autoform: {
          type: 'select-multiple'
        }
      },
      [`${itemId}.$`]: {
        type: String
      }
    }
  }
}

Item.register(ItemSelectMultiple, {
  schema: editSchema(ItemBase, ItemChoices, ItemSelectMultiple),
  build: itemSchema(ItemBase, ItemChoices, ItemSelectMultiple)
})

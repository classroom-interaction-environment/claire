import { ItemPlugins } from 'meteor/claire:plugin-registry'

const Categories = ItemPlugins.categories()
const DataTypes = ItemPlugins.dataTypes()
const reactive = ItemPlugins.translateReactive()

ItemPlugins.onLanguageChange(languageCode => {
  if (languageCode === 'de') {
    return import('./de.json')
  }
})

const pipsTypes = {
  range: {
    value: 'range',
    label: reactive('items.itemRange.range')
  },
  steps: {
    value: 'steps',
    label: reactive('items.itemRange.step')
  }
}

/**
 * CLAIRE Item plugin to use nouislider as range input.
 */

export const ItemRange = {
  name: 'itemRange',
  label: 'item.range',
  icon: 'sliders-h',
  category: Categories.numericalItems,
  dataType: DataTypes.numerical,
  edit () {
    return {
      minValue: {
        type: Number,
        label: reactive('items.itemRange.minValue'),
        defaultValue: 0
      },
      maxValue: {
        type: Number,
        label: reactive('items.itemRange.maxValue'),
        defaultValue: 100
      },
      startValue: {
        type: Number,
        label: reactive('items.itemRange.startValue'),
        defaultValue: 0
      },
      step: {
        type: Number,
        label: reactive('items.itemRange.step'),
        defaultValue: 1,
        min: 1
      },

      // OPTIONAL FIELDS

      minLabel: {
        type: String,
        label: reactive('items.itemRange.minLabel'),
        optional: true
      },
      maxLabel: {
        type: String,
        label: reactive('items.itemRange.maxLabel'),
        optional: true
      },
      pipTypes: {
        type: String,
        optional: true,
        label: reactive('items.itemRange.pipTypes'),
        defaultValue: pipsTypes.range.value,
        autoform: {
          options: () => Object.values(pipsTypes)
        }
      },
      pipCount: {
        type: Number,
        optional: true,
        min: 0,
        label: reactive('items.itemRange.pipCount'),
        defaultValue: 5
      }
    }
  },
  item ({ itemId, minValue, maxValue, minLabel, maxLabel, step, pipTypes, pipCount, startValue }) {
    return {
      [itemId]: {
        type: Number,
        max: maxValue,
        min: minValue,
        autoform: {
          defaultValue: startValue,
          type: 'noUiSlider',
          class: 'my-4 p-4',
          labelLeft: minLabel,
          labelRight: maxLabel,
          noUiSliderOptions: {
            start: startValue,
            step: step,
            tooltips: [true]
          },
          noUiSlider_pipsOptions: {
            mode: pipTypes,
            density: pipCount
          }
        }
      }
    }
  },
  load: async () => {
    const loadExtension = await import('meteor/muqube:autoform-nouislider')
    return loadExtension.default()
  }
}

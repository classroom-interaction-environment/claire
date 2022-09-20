import { ItemPlugins } from 'meteor/claire:plugin-registry'

const Categories = ItemPlugins.categories()
const DataTypes = ItemPlugins.dataTypes()

export const ItemTextArea = {
  name: 'itemTextArea',
  label: 'item.textArea',
  icon: 'align-justify',
  category: Categories.textItems,
  dataType: DataTypes.text,
  /**
   * Schema, used by editor to create a form that can be used to configure
   * the item appearance and behavior
   * @return {Object}
   */
  edit ({ translate }) {
    return {
      rows: {
        type: Number,
        optional: true,
        label: translate('form.rows'),
        min: 1,
        defaultValue: 5
      }
    }
  },
  /**
   * Schema used by the engine to build the item from the given configuration.
   * @param itemId
   * @param placeholder
   * @param rows
   * @param translate
   * @return {{}}
   */
  item ({ itemId, placeholder, rows }, { translate }) {
    return {
      [itemId]: {
        autoform: {
          type: 'textarea',
          placeholder: placeholder || translate(''),
          rows: rows
        }
      }
    }
  }
}

import { i18n } from '../../../../api/language/language'

export const List = {
  name: 'list',
  icon: 'list-ul',
  label: 'text.list',
  schema: {
    listIcon: {
      type: String,
      label: () => i18n.get('text.listIcon'),
      autoform: {
        afFieldInput: {
          type: 'iconSelect'
        }
      }
    },
    entries: {
      type: Array,
      label: () => i18n.get('common.entries')
    },
    'entries.$': {
      type: String,
      label: () => i18n.get('common.entry')
    }
  },
  /**
   * Loads the custom form type dynamically.
   * @return {Promise<{}>}
   */
  form: () => import('../../../../ui/forms/iconSelect/iconSelect')
}

export const Enum = {
  name: 'enum',
  icon: 'list-ol',
  label: 'text.enum',
  schema: {
    entries: {
      type: Array,
      label: () => i18n.get('common.entries')
    },
    'entries.$': {
      type: String,
      label: () => i18n.get('common.entry'),
      autoform: {
        afFieldInput: {
          autofocus: ''
        }
      }
    }
  }
}

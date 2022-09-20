import { i18n } from '../../../../api/language/language'

// TODO move to "layout" namespace

export const Alignment = {
  left: {
    value: 'center',
    label: i18n.reactive('orientation.left'),
    class: 'text-left'
  },
  center: {
    value: 'center',
    label: i18n.reactive('orientation.center'),
    class: 'text-center'
  },
  right: {
    value: 'right',
    label: i18n.reactive('orientation.right'),
    class: 'text-right'
  },
  justify: {
    value: 'justify',
    label: i18n.reactive('orientation.justify'),
    class: 'text-justify'
  }
}

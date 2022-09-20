import { i18n } from '../../../api/language/language'

export const FileSize = {
  byte: {
    value: 'byte',
    label: i18n.reactive('fileSize.byte')
  },
  kiloByte: {
    value: 'kbyte',
    label: i18n.reactive('fileSize.kiloByte')
  },
  megaByte: {
    value: 'mbyte',
    label: i18n.reactive('fileSize.megaByte')
  }
}

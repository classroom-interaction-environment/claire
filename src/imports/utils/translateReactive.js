import { i18n } from '../api/language/language'

export const translateReactive = (label, ...args) => () => i18n.get(label, ...args)

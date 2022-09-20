import { i18n } from '../../../../api/language/language'

export const option = context => ({ value: context.name, label: context.label })
export const firstOption = () => i18n.reactive('form.selectOne')

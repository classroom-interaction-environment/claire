import { i18n } from '../../../../api/language/language'

export const licenseOptions = [
  {
    optgroup: i18n.reactive('license.ccOer'),
    options: [
      { label: i18n.reactive('license.pd'), value: 'pd' },
      { label: i18n.reactive('license.ccby'), value: 'cc-by' },
      { label: i18n.reactive('license.ccbysa'), value: 'cc-by-sa' }
    ]
  },
  {
    optgroup: i18n.reactive('license.ccNonOer'),
    options: [
      { label: i18n.reactive('license.ccbync'), value: 'cc-by-nc' },
      { label: i18n.reactive('license.ccbyncsa'), value: 'cc-by-nc-sa' },
      { label: i18n.reactive('license.ccbynd'), value: 'cc-by-nd' },
      { label: i18n.reactive('license.ccbyncnd'), value: 'cc-by-nc-nd' }
    ]
  },
  {
    optgroup: i18n.reactive('license.nonFreeOthers'),
    options: [
      { label: i18n.reactive('license.copyright'), value: 'copyright' }
    ]
  }
]

import {onServerExec} from '../utils/onServerExec'
import {onClientExec} from '../utils/onClientExec'

export const H5PTranslation = {}

const internal = {
  translate: (key, lang) => key,
  getLocale: () => 'en'
}

/**
 *
 * @param addl10n
 * @param getLocale
 * @param translate
 */
H5PTranslation.config = ({ addl10n, getLocale, translate }) => {
  console.warn('set translation')
  internal.translate = (label, key) => {
    console.debug({ label, key })
    return translate(label, key)
  }
  internal.getLocale = getLocale

  onServerExec(async function () {
    const { de, en } = await import('../api/i18n/getServerLanguage')
    return addl10n({ de, en })
  })
}

H5PTranslation.getLocale = () => internal.getLocale()

H5PTranslation.translate = (...args) => internal.translate(...args)

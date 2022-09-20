import { ReactiveVar } from 'meteor/reactive-var'

const _initialized = new ReactiveVar(false)
let _provider = {
  get: x => x,
  currentLocale: {
    get: () => {}
  },
  setLocale: () => {},
  addl10n: () => {}
}

let defaultOptions = {}

export const i18n = {}

i18n.load = (provider, defaults = {}) => {
  _provider = provider
  _initialized.set(true)
  Object.assign(defaultOptions, defaults)
}

i18n.get = (...args) => {
  const last = args[args.length - 1]
  if (typeof last === 'object') {
    args[args.length - 1] = {
      ...defaultOptions,
      ...args[args.length - 1]
    }
  } else {
    args.push(defaultOptions)
  }
  return _provider.get(...args)
}

i18n.getLocale = () => {
  return _provider.currentLocale.get()
}

i18n.getSetting = () => {
  return _provider.getSetting('current')
}

i18n.initialized = () => _initialized.get()

i18n.setLocale = locale => {
  const current = _provider.currentLocale.get()
  if (current === locale) { return }

  _provider.setLocale(locale)
  setTimeout(() => {
    _listeners.forEach(fn => fn(locale))
  }, 0)
}

i18n.addl10n = config => {
  return _provider.addl10n(config)
}

/**
 * To be used with schema and autoform.
 */
i18n.reactive = (...args) => () => _provider.get(...args)

const _listeners = new Set()

i18n.onLocaleChange = (fn, { remove } = {}) => {
  if (_listeners.has(fn)) {
    return remove && _listeners.delete(fn)
  }

  _listeners.add(fn)
}

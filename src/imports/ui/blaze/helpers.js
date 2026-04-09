import { Meteor } from 'meteor/meteor'
import { i18n } from '../../api/language/language'
import { currentLanguage } from '../../api/language/currentLanguage'
import { ContextRegistry } from '../../infrastructure/context/ContextRegistry'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import { resolveRoute } from '../../api/routes/resolveRoute'
import { contrastColor } from '../utils/color/contrastColor'
import { Features } from '../../api/config/Features'
import { isTodayOrYesterday } from '../../utils/isTodayOrYesterday'
import { createLog } from '../../api/log/createLog'
import { getUser } from '../../contexts/system/accounts/users/getUser'
import { isTranslateableString } from '../../api/language/isTranslateableString'
import { translate } from '../../api/language/translate'
import { isCurriculum as isCurriculum2 } from '../../api/accounts/roles/isCurriculum'
import { hasAtLeastRole as hasAtLeastRole2 } from '../../api/accounts/roles/hasAtLeastRole'
import { isAdmin as isAdmin2 } from '../../api/accounts/roles/isAdmin'

export const feature = (name) => Features.get(name)

export const not = (a) => !a

export const ternary = (flag, a, b) => flag ? a : b

export const is = (a, b) => a === b

export const eq = (a, b) => a === b

export const neq = (a, b) => a !== b

export const gt = (a, b) => a > b

export const lt = (a, b) => a < b

export const gte = (a, b) => a > b

export const isIn = (a, b) => (Array.isArray(b) || typeof b === 'string') && b.indexOf(a) > -1

export const allTrue = (...args) => {
  args.pop()
  for (const arg of args) {
    if (!!arg === false) return false
  }
  return true
}

export const or = (...args) => {
  args.pop()
  for (const arg of args) {
    if (!!arg === true) return true
  }
  return false
}

export const allFalse = (...args) => {
  args.pop()
  for (const arg of args) {
    if (!!arg === true) return false
  }
  return true
}

export const trueFalse = (a, b) => a && !b

export const toIndex = (arrayIndex) => arrayIndex + 1

export const merge = (...args) => {
  args.pop()
  return args.join('')
}

export const concat = (...strings) => {
  strings.pop()
  return strings.join('')
}

export const log = createLog({ name: 'Template.globalHelper' })

export const oneOf = (compare, ...args) => {
  args.pop()
  return args.some(arg => arg === compare)
}

export const count = (iterable) => {
  if (!iterable) return 0
  if (iterable.length) return iterable.length
  if (iterable.size) return iterable.size()
  if (iterable.count) return iterable.count()
  throw new Error('unexpected non-iterable')
}

export const sumField = (iterable, field) => {
  if (!iterable || !field) return 0
  let sum = 0
  iterable.forEach(entry => {
    sum += (entry[field] || 0)
  })
  return sum
}

export const stringify = (obj, replacer = null, space = 2) => JSON.stringify(obj, replacer, space)

export const jsonSize = (obj = {}) => {
  const value = JSON.stringify(obj, null, 0)
  return (~-encodeURI(value).split(/%..|./).length) / 1000
}

export const connected = () => Meteor.status().connected

export const length = (list) => {
  if (list && list.constructor.name === 'Cursor') {
    return list.count()
  }
  return (list?.length) || 0
}

export const toUser = (userId) => getUser(userId) || { _id: userId, username: userId }

export const isOnline = (presence = {}) => presence.isOnline || presence?.status === 'online'

export const username = (userId) => {
  const user = getUser(userId)
  if (!user) return userId

  return `${user.firstName}, ${user.lastName}`
}

export { contrastColor }

export const shorten = (charLen, text) => {
  if (!charLen || !text) return text
  if (text.length <= charLen) {
    return text
  }
  else {
    return `${text.substring(0, charLen - 3)}...`
  }
}

export const fluid = () => {
  const user = Meteor.user()
  return user?.ui?.fluid
}

export const isAdmin = () => {
  const userId = Meteor.userId()
  return isAdmin2(userId)
}

export const isCurriculum = () => {
  const userId = Meteor.userId()
  return isCurriculum2(userId)
}

export const hasAtLeastRole = (role) => {
  const userId = Meteor.userId()
  return userId && role && hasAtLeastRole2(userId, role)
}

export const roleLabel = (roleValue) => i18n.get(`roles.${roleValue}`)

export const toDate = (date, type = 'datetime') => {
  if (!date) {
    return
  }
  const current = currentLanguage()

  if (type === 'time') {
    return date.toLocaleTimeString(current?.isoCode, current?.localeDateOptions)
  }

  const todayOrYesterday = isTodayOrYesterday(date)

  if (type === 'date') {
    return todayOrYesterday
      ? i18n.get(`time.${todayOrYesterday}`)
      : date.toLocaleDateString(current?.isoCode, current?.localeDateOptions)
  }

  return todayOrYesterday
    ? `${i18n.get(`time.${todayOrYesterday}`)}, ${date.toLocaleTimeString(current?.isoCode, current?.localeDateOptions)}`
    : date.toLocaleString(current?.isoCode, current?.localeDateOptions)
}

export const context = (name) => ContextRegistry.get(name)

export const userReady = () => {
  const user = Meteor.user
  return user?.profileReady // && Roles.subscription.ready()
}

export const route = (key, ...optionalArgs) => {
  const route = resolveRoute(key, ...optionalArgs)
  if (!route || route.includes('notfound')) {
    console.warn('did not resolve route for', key, optionalArgs)
  }
  return route
}

export const routeDef = (key) => Routes[key]

export const referrer = () => {
  const location = Router.location()
  return encodeURIComponent(location)
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: we want to export this as a global helper, so it needs to be named like this
export const encodeURIComponent = (value) => encodeURIComponent(value)

export const join = (char, ...args) => {
  args.pop()
  return args.join(char)
}

export const getIndex = (index) => typeof index === 'number' ? index + 1 : undefined

export const translateError = (e) => {
  if (!e) return
  if (isTranslateableString(e.reason)) {
    return translate(e.reason)
  }
  if (isTranslateableString(e.message)) {
    return translate(e.message)
  }

  return e.message
}

export { getUser }

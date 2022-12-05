import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { UserUtils } from '../../contexts/system/accounts/users/UserUtils'
import { i18n } from '../../api/language/language'
import { currentLanguage } from '../../api/language/currentLanguage'
import { ContextRegistry } from '../../infrastructure/context/ContextRegistry'
import { Routes } from '../../api/routes/Routes'
import { Router } from '../../api/routes/Router'
import { resolveRoute } from '../../api/routes/resolveRoute'
import { contrastColor } from '../utils/color/contrastColor'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { Features } from '../../api/config/Features'
import { isTodayOrYesterday } from '../../utils/isTodayOrYesterday'
import { createLog } from '../../api/log/createLog'

export const feature = function (name) {
  return Features.get(name)
}

export const not = function (a) {
  return !a
}

export const ternary = function (flag, a, b) {
  return flag ? a : b
}

export const is = function (a, b) {
  return a === b
}

export const eq = function (a, b) {
  return a === b
}

export const neq = function (a, b) {
  return a !== b
}

export const gt = function (a, b) {
  return a > b
}

export const lt = function (a, b) {
  return a < b
}

export const gte = function (a, b) {
  return a > b
}

export const isIn = function (a, b) {
  return (Array.isArray(b) || typeof b === 'string') && b.indexOf(a) > -1
}

export const allTrue = function (...args) {
  args.pop()
  for (const arg of args) {
    if (!!arg === false) return false
  }
  return true
}

export const or = function (...args) {
  args.pop()
  for (const arg of args) {
    if (!!arg === true) return true
  }
  return false
}

export const allFalse = function (...args) {
  args.pop()
  for (const arg of args) {
    if (!!arg === true) return false
  }
  return true
}

export const trueFalse = function (a, b) {
  return a && !b
}

export const toIndex = function (arrayIndex) {
  return arrayIndex + 1
}

export const merge = function (...args) {
  args.pop()
  return args.join('')
}

export const concat = function (...strings) {
  strings.pop()
  return strings.join('')
}

export const log = createLog({ name: 'Template.globalHelper' })

export const oneOf = function (compare, ...args) {
  args.pop()
  return args.some(arg => arg === compare)
}

export const count = function (iterable) {
  if (!iterable) return 0
  if (iterable.length) return iterable.length
  if (iterable.size) return iterable.size()
  if (iterable.count) return iterable.count()
  throw new Error('unexpected non-iterable')
}

export const sumField = function (iterable, field) {
  if (!iterable || !field) return 0
  let sum = 0
  iterable.forEach(entry => {
    sum += (entry[field] || 0)
  })
  return sum
}

export const stringify = function (obj, replacer = null, space = 2) {
  return JSON.stringify(obj, replacer, space)
}

export const jsonSize = function (obj = {}) {
  const value = JSON.stringify(obj, null, 0)
  return (~-encodeURI(value).split(/%..|./).length) / 1000
}

export const connected = function () {
  return Meteor.status().connected
}

export const length = function (list) {
  if (list && list.constructor.name === 'Cursor') {
    return list.count()
  }
  return (list && list.length) || 0
}

export const toUser = function (userId) {
  return getUser(userId) || { _id: userId, username: userId }
}

export const isOnline = function (presence = {}) {
  return presence.isOnline || presence?.status === 'online'
}

export const username = function (userId) {
  const user = getUser(userId)
  if (!user) return userId

  return `${user.firstName}, ${user.lastName}`
}

export { contrastColor }

export const shorten = function (charLen, text) {
  if (!charLen || !text) return text
  if (text.length <= charLen) {
    return text
  }
  else {
    return text.substring(0, charLen - 3) + '...'
  }
}

export const fluid = function () {
  const user = Meteor.user()
  return user && user.ui && user.ui.fluid
}

export const isAdmin = function () {
  const userId = Meteor.userId()
  return UserUtils.isAdmin(userId)
}

export const isCurriculum = function () {
  const userId = Meteor.userId()
  return UserUtils.isCurriculum(userId)
}

export const hasAtLeastRole = function (role) {
  const userId = Meteor.userId()
  return userId && role && UserUtils.hasAtLeastRole(userId, role)
}

export const roleLabel = function (roleValue) {
  return i18n.get(`roles.${roleValue}`)
}

export const toDate = function (date, type = 'datetime') {
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

export const context = function (name) {
  return ContextRegistry.get(name)
}

export const userReady = function () {
  const user = Meteor.user
  return user && user.profileReady && Roles.subscription.ready()
}

export const route = function (key, ...optionalArgs) {
  const route = resolveRoute(key, ...optionalArgs)
  if (!route || route.includes('notfound')) {
    console.warn('did not resolve route for', key, optionalArgs)
  }
  return route
}

export const routeDef = function (key) {
  return Routes[key]
}

export const referrer = function () {
  const location = Router.location()
  return encodeURIComponent(location)
}

export const encodeURIComponent = function (value) {
  return encodeURIComponent(value)
}

export const join = function (char, ...args) {
  args.pop()
  return args.join(char)
}

export const getIndex = function (index) {
  return typeof index === 'number' ? index + 1 : undefined
}

const getUser = query => (Meteor.users.findOne(query) || getLocalCollection(Meteor.users).findOne(query))

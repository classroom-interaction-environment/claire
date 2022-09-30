/* global Roles */
import { Meteor } from 'meteor/meteor'
import { Template } from 'meteor/templating'
import { Roles } from 'meteor/alanning:roles'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { i18n } from '../../../api/language/language'
import { currentLanguage } from '../../../api/language/currentLanguage'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { Routes } from '../../../api/routes/Routes'
import { Router } from '../../../api/routes/Router'
import { resolveRoute } from '../../../api/routes/resolveRoute'
import { contrastColor } from '../../../ui/utils/color/contrastColor'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { Features } from '../../../api/config/Features'
import { isTodayOrYesterday } from '../../../utils/isTodayOrYesterday'

Template.registerHelper('feature', function (name) {
  return Features.get(name)
})

Template.registerHelper('not', function (a) {
  return !a
})

Template.registerHelper('ternary', function (flag, a, b) {
  return flag ? a : b
})

Template.registerHelper('is', function (a, b) {
  return a === b
})

Template.registerHelper('eq', function (a, b) {
  return a === b
})

Template.registerHelper('neq', function (a, b) {
  return a !== b
})

Template.registerHelper('gt', function (a, b) {
  return a > b
})

Template.registerHelper('lt', function (a, b) {
  return a < b
})

Template.registerHelper('let', function (a, b) {
  return a <= b
})

Template.registerHelper('gte', function (a, b) {
  return a > b
})

Template.registerHelper('in', function (a, b) {
  return (Array.isArray(b) || typeof b === 'string') && b.indexOf(a) > -1
})

Template.registerHelper('allTrue', function (...args) {
  args.pop()
  for (const arg of args) { if (!!arg === false) return false }
  return true
})

Template.registerHelper('or', function (...args) {
  args.pop()
  for (const arg of args) {
    if (!!arg === true) return true
  }
  return false
})

Template.registerHelper('allFalse', function (...args) {
  args.pop()
  for (const arg of args) { if (!!arg === true) return false }
  return true
})

Template.registerHelper('trueFalse', function (a, b) {
  return a && !b
})

Template.registerHelper('toIndex', function (arrayIndex) {
  return arrayIndex + 1
})

Template.registerHelper('join', function (array = [], joinChar = '') {
  return array.join(joinChar)
})

Template.registerHelper('merge', function (...args) {
  args.pop()
  return args.join('')
})

Template.registerHelper('concat', function (...strings) {
  strings.pop()
  return strings.join('')
})

Template.registerHelper('log', function (...args) {
  console.log(...args)
})

Template.registerHelper('oneOf', function (compare, ...args) {
  args.pop()
  return args.some(arg => arg === compare)
})

Template.registerHelper('count', function (iterable) {
  if (!iterable) return 0
  if (iterable.length) return iterable.length
  if (iterable.size) return iterable.size()
  if (iterable.count) return iterable.count()
  throw new Error('unexpected non-iterable')
})

Template.registerHelper('sumField', function (iterable, field) {
  if (!iterable || !field) return 0
  let sum = 0
  iterable.forEach(entry => {
    sum += (entry[field] || 0)
  })
  return sum
})

Template.registerHelper('stringify', function (obj, replacer = null, space = 2) {
  return JSON.stringify(obj, replacer, space)
})

Template.registerHelper('jsonSize', function (obj = {}) {
  const value = JSON.stringify(obj, null, 0)
  return (~-encodeURI(value).split(/%..|./).length)/1000
})

Template.registerHelper('connected', function () {
  return Meteor.status().connected
})

Template.registerHelper('length', function (list) {
  if (list && list.constructor.name === 'Cursor') {
    return list.count()
  }
  return (list && list.length) || 0
})

Template.registerHelper('toUser', function (userId) {
  return getUser(userId) || { _id: userId, username: userId }
})

Template.registerHelper('isOnline', function (presence = {}) {
  return presence.isOnline || presence?.status === 'online'
})

Template.registerHelper('username', function (userId) {
  const user = getUser(userId)
  if (!user) return userId

  return `${user.firstName}, ${user.lastName}`
})

Template.registerHelper('contrastColor', contrastColor)

Template.registerHelper('shorten', function (charLen, text) {
  if (!charLen || !text) return text
  if (text.length <= charLen) {
    return text
  } else {
    return text.substring(0, charLen - 3) + '...'
  }
})

Template.registerHelper('fluid', function () {
  const user = Meteor.user()
  return user && user.ui && user.ui.fluid
})

Template.registerHelper('isAdmin', function () {
  const userId = Meteor.userId()
  return UserUtils.isAdmin(userId)
})

Template.registerHelper('isCurriculum', function () {
  const userId = Meteor.userId()
  return UserUtils.isCurriculum(userId)
})

Template.registerHelper('hasAtLeastRole', function (role) {
  const userId = Meteor.userId()
  return userId && role && UserUtils.hasAtLeastRole(userId, role)
})

Template.registerHelper('roleLabel', function (roleValue) {
  return i18n.get(`roles.${roleValue}`)
})

Template.registerHelper('toDate', function (date, type='datetime') {
  if (!date) { return }
  const current = currentLanguage()

  if (type === 'time') {
    return date.toLocaleTimeString(current?.isoCode, current?.localeDateOptions)
  }

  const todayOrYesterday = isTodayOrYesterday(date)

  if (type === 'date')  {
    return todayOrYesterday
      ? i18n.get(`common.${todayOrYesterday}`)
      : date.toLocaleDateString(current?.isoCode, current?.localeDateOptions)
  }

  return todayOrYesterday
    ? `${i18n.get(`common.${todayOrYesterday}`)}, ${date.toLocaleTimeString(current?.isoCode, current?.localeDateOptions)}`
    : date.toLocaleString(current?.isoCode, current?.localeDateOptions)
})

Template.registerHelper('context', function (name) {
  return ContextRegistry.get(name)
})

Template.registerHelper('userReady', function () {
  const user = Meteor.user
  return user && user.profileReady && Roles.subscription.ready()
})

Template.registerHelper('route', function (key, ...optionalArgs) {
  const route = resolveRoute(key, ...optionalArgs)
  if (!route || route.includes('notfound')) {
    console.warn('did not resolve route for', key, optionalArgs)
  }
  return route
})

Template.registerHelper('routeDef', function (key) {
  return Routes[key]
})

Template.registerHelper('referrer', function () {
  const location = Router.location()
  return encodeURIComponent(location)
})

Template.registerHelper('encodeURIComponent', function (value) {
  return encodeURIComponent(value)
})

Template.registerHelper('join', function (char, ...args) {
  args.pop()
  return args.join(char)
})

Template.registerHelper('getIndex', function (index) {
  return typeof index === 'number' ? index + 1 : undefined
})

const getUser = query => (Meteor.users.findOne(query) || getLocalCollection(Meteor.users).findOne(query))
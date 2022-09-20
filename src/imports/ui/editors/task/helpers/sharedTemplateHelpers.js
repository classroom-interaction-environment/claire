import { check } from 'meteor/check'
import { Template } from 'meteor/templating'
import { i18n } from '../../../../api/language/language'
import { Shared } from './shared'
import { TaskDefinitions } from '../../../../contexts/tasks/definitions/TaskDefinitions'

// TODO check if these are still relevant to be shared

Template.registerHelper('taskPageContentType', function () {
  return TaskDefinitions.helpers.contentTypes()
})

Template.registerHelper('taskPageMetaType', function (contentType, subcategoryFilter) {
  check(contentType, String)
  return TaskDefinitions.helpers.getSubtypes(contentType, subcategoryFilter)
})

Template.registerHelper('taskPageSubcategories', function (contentType) {
  check(contentType, String)
  const subCategories = TaskDefinitions.helpers.getSubtypeCategories(contentType)
  if (!subCategories || !subCategories.length) return
  return subCategories
})

Template.registerHelper('taskPageContentIcon', function (key) {
  return TaskDefinitions.helpers.contentIcon(key)
})

Template.registerHelper('taskPageMetaIcon', function (type, context) {
  const iTaskDef = TaskDefinitions.helpers.getMeta(type)
  const element = iTaskDef.get(context)
  return element?.icon
})

Template.registerHelper('taskPageContentLabel', function (key) {
  return TaskDefinitions.helpers.contentLabel(key)
})

Template.registerHelper('taskPageMetaLabel', function (contentKey, metaKey) {
  return TaskDefinitions.helpers.metaLabel(contentKey, metaKey)
})

Template.registerHelper('toTitle', function toTitle (str) {
  return str || i18n.get('common.untitled')
})

function strReduce (args = ['']) {
  return '' + args.reduce((a, b) => String(a) + String(b))
}

Template.registerHelper('str', function str (...args) {
  args.pop()
  return strReduce(args)
})

Template.registerHelper('target', function target (...args) {
  args.pop()
  if (!args || args.length === 0) return false
  const target = strReduce(args)
  return Shared.cache.get('target') === target
})

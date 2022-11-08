import { Tracker } from 'meteor/tracker'
import { ReactiveVar } from 'meteor/reactive-var'
import { check, Match } from 'meteor/check'
import { editSchema, itemLoad, itemSchema, option } from '../common/helpers'
import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'
import { isResponseDataType } from '../../../../api/utils/check/isResponseDataType'
import { createDebugLog, LogTypes } from '../../../../api/log/createLog'
import { ITaskDefinition } from '../ITaskDefinition'
import { ItemPlugins } from 'meteor/claire:plugin-registry'
import { getItemBase } from './getItemBase'
import { Features } from '../../../../api/config/Features'

export const Item = {}

Item.name = 'item'
Item.label = 'item.title'
Item.types = {}
Item.icon = 'pen-square'
Item.options = {}
Item.dataTypes = Object.assign({}, ResponseDataTypes)
Item.categories = new Map()

Item.categories.set('notCategorized', {
  name: 'notCategorized',
  label: 'itemTypes.notCategorized',
  icon: 'minus',
  base: getItemBase().name
})

Item.renderer = {
  template: 'itemRenderer',
  load: async function () {
    return import('../../../../ui/renderer/item/itemRenderer')
  }
}

const debug = createDebugLog(Item.name, LogTypes.debug)

/// /////////////////////////////////////////////////////////////////////////////////////////////
//
//  INITIALIZE
//
/// /////////////////////////////////////////////////////////////////////////////////////////////

const initialized = new ReactiveVar(false)
let localeTracker

/**
 * Allows to determine, whether this module has been initialized.
 * @return {boolean}
 */
Item.isInitialized = function () {
  return initialized.get()
}

/**
 * Loads all default items into itself. Not suitable for registering external items
 * @return {Promise<void>}
 */

Item.initialize = async function () {
  if (initialized.get()) {
    return true
  }

  await import('./base')
  await import('./text')
  await import('./choice')
  await import('./range')
  await import('./file')

  if (Features.get('groups')) {
    await import('./groups')
  }

  const { i18n } = await import('../../../../api/language/language')

  // implement plugin helpers
  ItemPlugins.translate((...args) => i18n.get(...args))
  ItemPlugins.categories(() => Object.fromEntries(Item.categories.entries()))
  ItemPlugins.dataTypes(() => Object.assign({}, ResponseDataTypes))

  // load and register plugins
  const plugins = await ItemPlugins.load()
  plugins.forEach(({ name, plugin }) => processPlugin(name, plugin))

  // setup reactive language updates
  localeTracker = Tracker.autorun(() => {
    const currentLocale = i18n.getLocale()
    ItemPlugins.onLanguageChange(currentLocale)
      .catch(e => console.error(e))
      .then(languageUpdates => {
        languageUpdates.forEach(dict => {
          if (dict) {
            i18n.addl10n({
              [currentLocale]: dict
            })
          }
        })
      })
  })

  initialized.set(true)
  return true
}

/// /////////////////////////////////////////////////////////////////////////////////////////////
//
//  REGISTER
//
/// /////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Keeps an internal reference to all registered item-contexts
 * @type {Map<any, any>}
 * @private
 */
const contextMap = new Map()

const processPlugin = (name, plugin) => {
  debug('(processPlugin)', name)

  if (contextMap.has(plugin.name)) {
    return false
  }

  // assign dataType if only referenced by String
  if (typeof plugin.dataType === 'string') {
    plugin.dataType = ResponseDataTypes[plugin.dataType]
  }

  const categoryType = typeof plugin.category

  // if the category is an Object, then it's likely for the plugin to define a
  // new category. If so, we check if it does not exist and add it to the map
  if (categoryType === 'object' && plugin.category !== null) {
    const categoryName = plugin.category.name

    if (!Item.categories.has(categoryName)) {
      Item.categories.set(categoryName, plugin.category)
    }
  }

  // the default, however is, that a plugin references a category
  else {
    const category = Item.categories.get(plugin.category)

    // if the reference did not resolve, we fall back to not categorized
    plugin.category = category ?? Item.categories.get('notCategorized')
  }

  const defaultItemBase = getItemBase()
  const extend = [defaultItemBase]

  if (plugin.category.base !== defaultItemBase.name) {
    const extendedContext = contextMap.get(plugin.category.base)

    if (extendedContext) {
      extend.push(extendedContext)
    }
  }

  extend.push(plugin)

  const schemaDefinitions = {
    schema: editSchema(...extend),
    build: itemSchema(...extend),
    load: itemLoad(...extend)
  }

  return Item.register(plugin, schemaDefinitions)
}

Item.register = function (context, schemaDefinitions) {
  debug('(register item context)', context.name)
  check(context.name, String)
  check(context.label, String)
  check(context.dataType, Match.Where(isResponseDataType))
  check(context.category, {
    name: String,
    label: String,
    icon: String,
    base: Match.Maybe(String)
  })

  const publicFields = {}
  Object.keys(schemaDefinitions.schema).forEach(key => (publicFields[key] = 1))

  // item add to the internal contexts map
  const name = context.name
  contextMap.set(name, Object.assign({}, context, schemaDefinitions, {
    icon: context.icon || context.category.icon,
    publicFields: publicFields,
    dataType: context.dataType || ResponseDataTypes.string
  }))

  // add category if not already there
  const category = context.category.name
  if (!Item.categories.has(category)) {
    Item.categories.set(category, context.category)
  }

  // add to options list
  if (!this.options[category]) {
    this.options[category] = {
      name: context.category.name,
      label: context.category.label,
      icon: context.category.icon,
      values: []
    }
  }
  this.options[category].values.push(option(context))

  debug('[Item]: registered', context.name)
}

ITaskDefinition(Item, contextMap)

/// /////////////////////////////////////////////////////////////////////////////////////////////
//
//  ACCESS
//
/// /////////////////////////////////////////////////////////////////////////////////////////////

Item.getDataTypeBy = function (name) {
  if (!Item.isInitialized()) {
    console.warn('Item is not initialized')
  }
  const ctx = contextMap.get(name)
  return ctx && ctx.dataType
}

Item.extract = function (itemId, document) {
  if (!itemId || !document) return

  let item

  document.pages.some(page => {
    if (!page.content) return false

    const found = page.content.find(entry => entry.itemId === itemId)
    if (found) {
      item = found
      return true
    }
  })

  return item
}

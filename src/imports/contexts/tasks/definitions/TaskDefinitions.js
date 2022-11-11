import { ReactiveVar } from 'meteor/reactive-var'
import { Text } from './text/Text'
import { WebResources } from '../../resources/web/WebResources'
import { Item } from './items/Item'
import { Files } from '../../files/Files'
import { H5P } from './h5p/H5P'
import { i18n } from '../../../api/language/language'
import { TaskElementPlugins } from '../../../api/plugins/PluginRegistry'
import { createLog } from '../../../api/log/createLog'
import { isMaterial } from '../../material/isMaterial'

export const TaskDefinitions = {} // TODO rename to TaskElements

TaskDefinitions.name = 'TaskDefinitions'

/// ////////////////////////////////////////////////////////////////////////////
//
//  MAPPING / DATA STRUCTURES
//
/// ////////////////////////////////////////////////////////////////////////////

TaskDefinitions.types = {
  Text,
  WebResources,
  Files,
  Item,
  H5P
}

// TODO make a Map
const typeMap = new Map(Object.entries({
  [Item.name]: Item,
  [WebResources.name]: WebResources,
  [Text.name]: Text,
  [Files.name]: Files,
  [H5P.name]: H5P
}))

const log = createLog({ name: TaskDefinitions.name, type: 'debug' })

/// ////////////////////////////////////////////////////////////////////////////
//
//  INITIALIZE
//
/// ////////////////////////////////////////////////////////////////////////////

const init = new ReactiveVar()
let localeTracker
let initializing = false

TaskDefinitions.initialize = function () {
  if (!initializing && !init.get()) {
    initializing = true
    initialize()
      .then(res => {
        initializing = false
        init.set(res)
      })
      .catch(e => {
        initializing = false
        console.error(e)
      })
  }
  return init
}

async function initialize () {
  await Item.initialize()
  await Files.initialize()
  await H5P.initialize()

  TaskElementPlugins.translate((...args) => i18n.get(...args))
  TaskElementPlugins.categories(() => Object.fromEntries(typeMap.entries()))

  const plugins = await TaskElementPlugins.load()
  plugins.forEach(({ name, plugin }) => processPlugin(name, plugin))

  // TODO merge localeTrackers into one Tracker in plugin registry
  localeTracker = Tracker.autorun(() => {
    const currentLocale = i18n.getLocale()
    TaskElementPlugins.onLanguageChange(currentLocale)
      .catch(e => console.error(e))
      .then(languageUpdates => {
        languageUpdates.forEach(dict => {
          i18n.addl10n({
            [currentLocale]: dict
          })
        })
      })
  })

  init.set(true)
  return true
}

const processPlugin = (name, plugin) => {
  log('(processPlugin)', name, plugin)

  // get the type of cateory
  const category = typeMap.get(plugin.category)

  if (!category) {
    throw new Error(`Unexpected category value [${category}] for plugin [${name}]`)
  }

  // if the reference did not resolve, we fall back to not categorized
  plugin.category = category
  category.register(plugin)
}

/// ////////////////////////////////////////////////////////////////////////////
//
//  INTERNAL
//
/// ////////////////////////////////////////////////////////////////////////////

const getTaskElementCategory = name => {
  const category = typeMap.get(name)
  if (!category) {
    throw new Error(`Expected a known TaskElement category, but got [${name}]`)
  }

  return category
}

/// ////////////////////////////////////////////////////////////////////////////
//
//  API
//
/// ////////////////////////////////////////////////////////////////////////////

TaskDefinitions.helpers = {
  isRegistered: ({ type, meta }) => {
    const typeDef = typeMap.get(type)
    return typeDef && !!typeDef.get(meta)
  },
  contentTypes () {
    if (!this._types) {
      this._types = Object.values(TaskDefinitions.types).map(entry => ({
        icon: entry.icon,
        value: entry.name,
        label: entry.label
      }))
    }

    return this._types
  },
  getMeta: getTaskElementCategory,
  contentLabel (key) {
    return typeMap.get(key)?.label
  },
  contentIcon (key) {
    return typeMap.get(key)?.icon
  },
  getCategory (name) {
    return getTaskElementCategory(name)
  },
  getSubtypes (type, subcategoryFilter) {
    const iTaskDefinition = getTaskElementCategory(type)
    const materialContexts = iTaskDefinition.getMaterialContexts()
    const values = materialContexts && Object.values(materialContexts)

    if (!values) return

    return values.filter(ctx => {
      if (Files.hasIdentity(ctx) && !isMaterial(ctx)) {
        return false
      }

      if (typeof subcategoryFilter === 'string' && ctx?.category?.name !== subcategoryFilter) {
        return false
      }

      return true
    })
  },
  getSubtypeCategories (type) {
    const iTaskDefinition = getTaskElementCategory(type)
    const materialContexts = iTaskDefinition.getMaterialContexts()
    if (!materialContexts) return

    const categories = new Set()
    Object.values(materialContexts).forEach(ctx => {
      if (ctx.category) categories.add(ctx.category)
    })

    return Array.from(categories)
  },
  metaLabel (categoryName, elementName) {
    const category = getTaskElementCategory(categoryName)
    const element = category.get(elementName)
    return element?.label
  }
}

const injectables = {
  translate: (...args) => () => i18n.get(...args)
}

TaskDefinitions.helpers.schema = (categoryName, subType, options) => {
  const category = getTaskElementCategory(categoryName)
  const allOptions = Object.assign(injectables, options)

  if (typeof category.schema === 'function') {
    return category.schema(subType, allOptions)
  }

  if (typeof category.helpers?.schema === 'function') {
    return category.helpers.schema(subType, allOptions)
  }

  // @deprecated
  console.warn('[TaskDefinitions] using deprecated contexts object')
  return category.contexts[subType] && category.contexts[subType].schema
}

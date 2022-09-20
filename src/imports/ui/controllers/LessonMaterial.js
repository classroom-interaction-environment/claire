import { Tracker } from 'meteor/tracker'
import { SubsManager } from '../subscriptions/SubsManager'
import { Unit } from '../../contexts/curriculum/curriculum/unit/Unit'
import { Phase } from '../../contexts/curriculum/curriculum/phase/Phase'
import { Material } from '../../contexts/material/Material'
import { $in } from '../../api/utils/query/inSelector'
import {
  createDebugLog,
  LogTypes
} from '../../api/log/createLog'
import { callMethod } from './document/callMethod'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { getCollection } from '../../api/utils/getCollection'
import { templateExists } from '../utils/templateExists'
import { isMaterial } from '../../contexts/material/isMaterial'
import { getMaterialRenderer } from '../../api/material/getMaterialRenderer'

export const LessonMaterial = {}

const debug = createDebugLog('LessonMaterial', LogTypes.debug, { devOnly: true })

//==============================================================================
//
//  SUBSCRIBE
//
//==============================================================================

/**
 * @deprecated
 * Subscribes to all lesson material for the given unit. Use this in editors,
 * that require live updates for changes in the material and unit.
 * @param unitDoc {Document} the current unit document
 * @param callback {Function} receive onError/onReady response from publications
 */
LessonMaterial.subscribe = (unitDoc, callback) => setTimeout(() => {
  subscribe(unitDoc, callback)
}, 0)

function subscribe (unitDoc, callback) {
  const _loaded = {}
  const queue = (target, context) => {
    if (target && target.length > 0) {
      _loaded[context.name] = false
      console.error('deprecated: use API.subscribe instead of direct SubsManager calls')
      return SubsManager.subscribe(context.publications.editor.name, { _id: $in(target) }, {
        onError: callback
      })
    }
  }

  const check = (handle, context) => {
    if (handle && handle.ready()) {
      _loaded[context.name] = true
    }
  }

  const allSubs = []
  const allLoaded = () => Object.values(_loaded).every(entry => entry === true)

  // TODO iterate all materials instead of only those, linked by the unitDoc
  Object.entries(unitDoc).forEach(([fieldName, materialIds]) => {
    const contextName = Material.getContextNameForField(fieldName)
    if (!contextName) return

    const context = Material.get(contextName)
    if (!context) {
      return callback(new Error(`Expected Material-context by name [${contextName}] for field [${fieldName}]`))
    }

    allSubs.push({
      handle: queue(materialIds, context),
      context: context
    })

    debug('queue', contextName)
  })

  if (allSubs.length === 0) {
    return callback(null, false)
  }

  Tracker.autorun((computation) => {
    allSubs.forEach(({ handle, context }) => check(handle, context))

    if (allLoaded()) {
      computation.stop()
      callback(null, true)
    }
  })
}

//==============================================================================
//
//  LOAD (METHODS)
//
//==============================================================================

/**
 * Loads all phases + all material for this current unit via Meteor method.
 * @param unitDoc {Document} the current unit document
 * @param callback {Function} receive err/res response
 * @return {Object} an object containing all materials mapped
 */
LessonMaterial.load = (unitDoc, callback) => {
  load(unitDoc)
    .then(result => callback(undefined, result))
    .catch(error => callback(error))
}

async function load (unitDoc) {
  const unitId = unitDoc._id
  const data = await callMethod({
    name: Unit.methods.loadMaterial,
    args: { _id: unitId }
  })

  Object.entries(data).forEach(([contextName, documents]) => {
    if (documents?.length) {
      const collection = getLocalCollection(contextName)

      documents.forEach(document => {
        debug(`<${contextName}> update local collection with ${document._id}`)
        collection.upsert({ _id: document._id }, { $set: document })
      })
    }
  })

  const phases = await callMethod({
    name: Phase.methods.byUnitId,
    args: { unitId }
  })

  const PhaseCollection = getLocalCollection(Phase.name)
  ;(phases || []).forEach(phaseDoc => {
    debug(`<${Phase.name}> update ${phaseDoc._id}`)
    PhaseCollection.upsert({ _id: phaseDoc._id }, { $set: phaseDoc })
  })

  data.phases = phases

  return data
}

//==============================================================================
//
//  PREVIEW
//
//==============================================================================

LessonMaterial.getPreviewRenderer = function (materialDoc) {
  const { name } = materialDoc
  const ctx = getContext(name) || {}
  return isMaterial(ctx)
    ? getMaterialRenderer(ctx.material, 'preview')
    : ctx.renderer
}

LessonMaterial.loadPreviewTemplate = async function (materialDoc) {
  const { name } = materialDoc
  const renderer = LessonMaterial.getPreviewRenderer(materialDoc)

  if (!renderer) {
    throw new Error(`Expected a renderer for context [${name}]`)
  }

  // skip if Template is already loaded (which is indicated by it's existence)
  const { template, load } = renderer
  if (templateExists(template)) {
    return true
  }

  // load template
  debug(`load preview renderer [${template}] for context [${name}]`)
  const module = await load()
  debug('loaded', !!module)
  return true
}

/**
 * @param materialDoc {Object}
 * @param instance {Template.instance}
 * @return {Object|undefined}
 */
LessonMaterial.getPreviewData = function getPreviewData ({ materialDoc, templateInstance, options }) {
  const { referenceId, name } = materialDoc
  const document = getLocalCollection(name).findOne(referenceId) || getCollection(name).findOne(referenceId)

  if (!document) {
    return {}
  }

  const ctx = getContext(name)
  const renderer = getMaterialRenderer(ctx?.material, 'preview') || {}
  const dataFn = renderer.data

  return typeof dataFn === 'function'
    ? dataFn({ materialDoc, document, templateInstance, options })
    : defaultData({ materialDoc, document, templateInstance, options })
}

/**
 * Resolves a renderer template from a given material definitions document.
 * @param materialDoc {Object}
 * @return {String|undefined}
 */
LessonMaterial.getPreviewTemplate = function (materialDoc) {
  const renderer = LessonMaterial.getPreviewRenderer(materialDoc)
  const template = renderer?.template

  if (!templateExists(template)) {
    console.warn('[Template]: ', template, 'does not exist')
  }

  return template
}

//==============================================================================
//
//  PRIVATE / INTERNAL
//
//==============================================================================

const getContext = name => {
  const ctx = Material.get(name)

  if (!ctx) {
    throw new Error(`Found no context for name [${name}]`)
  }

  return ctx
}

const defaultData = ({ materialDoc, document, options }) => {
  const { preview = true, print = false, student = false } = options
  const { name } = materialDoc
  return Object.assign({}, document, {
    meta: name,
    preview: preview,
    print: print,
    student: student // TODO still required?
  })
}

import { check, Match } from 'meteor/check'
import { RawResponse } from './aggregate/raw/RawResponse'
import { isResponseDataType } from '../../../api/utils/check/isResponseDataType'
import { isMaybeObject } from '../../../api/utils/check/isMaybeObject'
import { isResponseProcessorType } from './isResponseProcessorType'
import { createLog } from '../../../api/log/createLog'

/**
 * Registers and manages all available response processors for various data
 * types.
 *
 * You should not use it directly, we have loaders and APIs for that.
 */
export const ResponseProcessorRegistry = {}

const debugLog = createLog({ name: 'ResponseProcessorRegistry', type: 'debug' })

// /////////////////////////////////////////////////////////////////////////////
//
// CONTEXT REGISTRY
//
// /////////////////////////////////////////////////////////////////////////////

const contextsMap = new Map()
const dataTypeMap = new Map()
const fileTypeMap = new Map()

contextsMap.set(RawResponse.name, RawResponse)

const toContext = name => contextsMap.get(name)

const checkResponseProcessorContext = ({ name, label, icon, isResponseProcessor, schema, renderer, language }) => {
  check(name, String)
  check(label, String)
  check(icon, String)
  check(isResponseProcessor, Match.Where(flag => flag === true))
  check(schema, Match.Where(isMaybeObject))
  check(language, Match.Maybe(Function))
  check(renderer, {
    template: String,
    load: Function
  })
  return true
}

/**
 * Registers a new ResponseProcessor context.
 * @param context
 * @return {any}
 */
ResponseProcessorRegistry.register = function (context) {
  const { name, type, dataTypes, fileType, csp, renderer } = context
  debugLog('register', { context })

  check(name, String)
  check(type, Match.Where(isResponseProcessorType))
  check(dataTypes, Match.Where(x => x.every(isResponseDataType)))
  check(fileType, Match.Maybe(String)) // fixme use common file type definition
  // check(csp, Match.Where(isCspRule))
  checkResponseProcessorContext(context)

  // if we have a fileType definition we want to add it to a specific dict
  // since files introduce another sub level of types
  if (fileType) {
    const defaultFileType = fileTypeMap.get(fileType) || {
      default: name,
      values: []
    }
    defaultFileType.values.push(name)
    fileTypeMap.set(fileType, defaultFileType)
  }

  dataTypes.forEach((dataTypeName, index) => {
    // the first entry for a dataType is the default so there will always be a
    // default in case it has not been declared explicitly
    const dataType = dataTypeMap.get(dataTypeName) || {
      default: name,
      defaultIndex: index,
      values: []
    }

    // we allow RPs to define the priority of what they support
    // the higher the type in the list (the lower the index), the higher the priority
    // and if it beats the current default then we
    // - replace the default with the new one
    // - place the new one in the list as the first one
    // otherwise we simply add it to the pool at the end
    if (index < dataType.defaultIndex) {
      dataType.default = name
      dataType.defaultIndex = index
      dataType.values.unshift(name)
    }
    else {
      dataType.values.push(name)
    }

    dataTypeMap.set(dataTypeName, dataType)
  })

  contextsMap.set(name, context)
  debugLog(`registered "${name}" for type "${type}"`)

  return contextsMap.get(name)
}

/**
 * In order to fallback on any undefined processor this function
 * should be used to display the raw data.
 * @return {RawResponse}
 */
ResponseProcessorRegistry.fallback = () => RawResponse

/**
 * Returns a registered context by name or undefined if not found.
 *
 * If not found use {ResponseProcessorRegistry.fallback} to get a raw
 * response fallback.
 *
 * @param name {String} the name of the registered context
 * @return {Object|undefined} the registered context
 */
ResponseProcessorRegistry.get = function (name) {
  return contextsMap.get(name)
}

ResponseProcessorRegistry.forEach = fct => contextsMap.forEach(fct)

/**
 * Returns all registered context for a given data type ({ResponseDataType})
 * @param dataType
 * @return {Array}
 */
ResponseProcessorRegistry.allForDataType = dataType => {
  check(dataType, Match.Where(isResponseDataType))

  const dataTypeName = typeof dataType === 'object'
    ? dataType.name
    : dataType

  const typeMap = dataTypeMap.get(dataTypeName) || { values: [] }
  const contexts = new Set(typeMap.values.map(toContext))
  contexts.add(RawResponse)

  return Array.from(contexts)
}

/**
 *
 * @param fileType
 */
ResponseProcessorRegistry.allForFileType = fileType => {
  check(fileType, String) // fixme use common file type def

  const typeMap = fileTypeMap.get(fileType) || { values: [] }
  const contexts = new Set(typeMap.values.map(toContext))
  contexts.add(RawResponse)

  return Array.from(contexts)
}

/**
 * Returns a default processor for a given dataType and the fallback
 * if none has been found.
 * @param dataType
 * @return {Object|undefined}
 */
ResponseProcessorRegistry.defaultForDataType = dataType => {
  check(dataType, Match.Where(isResponseDataType))
  const typeName = typeof dataType === 'object'
    ? dataType.name
    : dataType
  const typeMap = (dataTypeMap.get(typeName) || {})
  return typeMap.default && contextsMap.get(typeMap.default)
}

/**
 * Returns the default rp by given file type (audio, images, documents, videos)
 * @param fileType
 * @return {*}
 */
ResponseProcessorRegistry.defaultForFileType = fileType => {
  check(fileType, String) // FIXME use a common file type definition

  const typeMap = (fileTypeMap.get(fileType) || {})
  return typeMap.default && contextsMap.get(typeMap.default)
}

/**
 * Returns all registered response processors by a given type ({ResponseProcessorTypes})
 * @param type
 * @return {Array}
 */
ResponseProcessorRegistry.byType = type => {
  check(type, Match.Where(isResponseProcessorType))
  const out = []
  contextsMap.forEach(value => {
    if (value.type === type) {
      out.push(value)
    }
  })
  return out
}

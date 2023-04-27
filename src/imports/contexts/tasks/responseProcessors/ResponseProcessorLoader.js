import { ReactiveVar } from 'meteor/reactive-var'
import { ResponseProcessorRegistry } from './ResponseProcessorRegistry'
import { Item } from '../definitions/items/Item'
import { TaskResults } from '../results/TaskResults'
import { Lesson } from '../../classroom/lessons/Lesson'
import { getCollection } from '../../../api/utils/getCollection'
import { templateExists } from '../../../ui/utils/templateExists'

/**
 * Use to load response processors templates on the client.
 *
 * @locus client
 */
export const ResponseProcessorLoader = {}

// /////////////////////////////////////////////////////////////////////////////
//
// Internal
//
// /////////////////////////////////////////////////////////////////////////////

const init = new ReactiveVar()

/**
 * @private
 */
async function initialize () {
  return import('../../../startup/both/plugins/loadDefaultResponseProcessors')
}

/**
 * @private
 */
function getResponseProcessor ({ responseProcessor, meta, dataType, fileType }) {
  let context

  // best case: rp is defined
  if (responseProcessor) {
    context = ResponseProcessorRegistry.get(responseProcessor)
    if (context) return context
  }

  // fallback 1: use fileType for items with file background
  if (fileType) {
    context = ResponseProcessorRegistry.defaultForFileType(fileType)
    if (context) {
      return context
    }
  }

  // fallback 2: use dataType if defined
  if (dataType) {
    context = ResponseProcessorRegistry.defaultForDataType(dataType)
    if (context) {
      return context
    }
  }

  // fallback 3: resolve a datataype by item definitions
  const resolvedDataType = Item.getDataTypeBy(meta)
  context = ResponseProcessorRegistry.defaultForDataType(resolvedDataType)
  if (context) {
    return context
  }

  // finally: if we did not find any matching RP, we return a raw-response
  // rp, which basically displays the raw data as-is
  return ResponseProcessorRegistry.fallback()
}

// /////////////////////////////////////////////////////////////////////////////
//
// Public
//
// /////////////////////////////////////////////////////////////////////////////

ResponseProcessorLoader.initialize = function ({ onError = console.error, onComplete = () => {} } = {}) {
  if (!init.get()) {
    initialize()
      .then(res => {
        init.set(res)
        onComplete()
      })
      .catch(onError)
  }
  return init
}

/**
 * Imports the RP renderer template and returns the template name as callback result.
 * @param name
 * @param renderer
 * @return {Promise<String>}
 */
ResponseProcessorLoader.importTemplate = async function importTemplate ({ name, renderer }) {
  if (!templateExists(renderer.template)) {
    await renderer.load()
  }

  return renderer.template
}

/**
 * Returns a registered response processor any of the by given
 * dataType, name, meta or fileType. Only one of them is required to search.
 *
 * @param dataType {String} name of the dataType
 * @param responseProcessor {String} name of the rp
 * @param meta {String} name of the item meta-type
 * @param fileType {String} name of the file-type
 * @return {Object|*}
 */
ResponseProcessorLoader.get = function get ({ dataType, responseProcessor, meta, fileType }) {
  return getResponseProcessor({ dataType, responseProcessor, meta, fileType })
}

/**
 * Completely loads an rp including template and data.
 *
 * @param item
 * @param lessonId
 * @param taskId
 * @param itemId
 * @return {Promise<{template: String, data: *}>}
 */
ResponseProcessorLoader.loadAll = async function ({ item, lessonId, taskId, itemId }) {
  const responseProcessor = getResponseProcessor(item)

  // At first we load the template to make sure it's in the registry.
  // Then we merge the item entry with all relevant data for the RP.
  const template = await ResponseProcessorLoader.importTemplate(responseProcessor)
  const data = Object.assign({}, item)
  data.lessonDoc = getCollection(Lesson.name).findOne(lessonId)
  data.results = getCollection(TaskResults.name).find({
    itemId,
    taskId,
    lessonId
  }).fetch()
  data.responseProcessor = responseProcessor
  data.lessonId = lessonId
  data.taskId = taskId
  data.itemId = itemId

  return { template, data }
}

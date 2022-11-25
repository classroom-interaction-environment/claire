import { Meteor } from 'meteor/meteor'
import { Tracker } from 'meteor/tracker'
import { ReactiveDict } from 'meteor/reactive-dict'
import { ResponseProcessorLoader } from '../../contexts/tasks/responseProcessors/ResponseProcessorLoader'
import { callMethod } from '../../ui/controllers/document/callMethod'
import { setFatalError } from '../../ui/components/fatal/fatal'
import { getCollection } from '../utils/getCollection'
import { Interact } from '../../ui/interact/Interact'
import { SubsManager } from '../../ui/subscriptions/SubsManager'
import { dataTarget } from '../../ui/utils/dataTarget'
import { debounce } from '../utils/debounce'
import { Beamer } from '../../contexts/beamer/Beamer'
import { Item } from '../../contexts/tasks/definitions/items/Item'
import { ResponseDataTypes } from '../plugins/ResponseDataTypes'
import { createMaterialId } from '../material/createMaterialId'

/**
 * Use to interact with ResponseProcessors. Since RP can be very different in
 * what they offer and what users can do with them, this API builds a middleware
 * to handle requests between the Template and the RP.
 *
 * @locus client
 */
export const ResponseProcessorAPI = {}

const actions = new ReactiveDict()
const actionHandlers = new Map()
const apiMap = new Map()

// registering a global resize listener and distribute the event
// to all listening components using in a debounced fashion
const resizeListeners = new Map()
const onResize = debounce(event => resizeListeners.forEach(callback => callback(event)), 200)
window.addEventListener('resize', onResize)

// for grid layout changes we use the reactive grid method from the Beamer class
// TODO check of we can decouple Beamer from this, if necessah
Tracker.autorun(() => {
  const grid = Beamer.doc.grid()
  setTimeout(() => {
    resizeListeners.forEach(callback => callback(grid))
  }, 500)
})

/**
 * Returns all registered actions for a given responseId
 * @param responseId
 * @return {Array|undefined}
 */
ResponseProcessorAPI.getActions = responseId => {
  const actionObj = actions.get(responseId)
  return actionObj && Object.values(actionObj)
}

ResponseProcessorAPI.callAction = (actionId, targetId, event, templateInstance) => {
  const handler = actionHandlers.get(actionId)
  if (handler && handler[targetId]) {
    handler[targetId].call(templateInstance, event)
  }
}

ResponseProcessorAPI.create = (itemData, templateInstance) => {
  const { meta, lessonId, taskId, itemId } = itemData
  const context = ResponseProcessorLoader.get(itemData)

  if (!context) {
    return setFatalError(new Meteor.Error('errors.contextNotFound'))
  }

  const { publications } = context
  const subscription = publications && SubsManager.subscribe(publications.byItem.name, {
    lessonId,
    taskId,
    itemId
  })

  const actionId = createMaterialId(lessonId, taskId, itemId)
  const { methods } = context
  const ItemContext = Item.get(meta)
  const dataType = typeof ItemContext.dataType === 'object'
    ? ItemContext.dataType
    : ResponseDataTypes[ItemContext.dataType]

  if (!apiMap.has(actionId)) {
    const api = {
      responseProcessor: context,
      getCollection: getCollection,
      dataTarget: dataTarget,
      Interact: Interact,
      subscriptions: subscription,
      item: () => ItemContext,
      dataTypes: () => ResponseDataTypes,
      dataType: () => dataType,
      responseId: () => actionId,
      registerAction: function ({ id, type, icon, label, visible = true, handler }) {
        const currentActions = actions.get(actionId) || {}
        currentActions[id] = { id, type, icon, label, visible }
        actions.set(actionId, currentActions)

        // we need to setup the handlers in a non-reactive way, in order
        // to preserve the linked function. also only update them if they
        // don't refer to the same function
        const actionHandler = actionHandlers.get(actionId) || {}
        if (actionHandler[id] !== handler) {
          actionHandler[id] = handler
          actionHandlers.set(actionId, actionHandler)
        }
      },
      document: context.schema && (() => {
        return getCollection(context.name).findOne({ lessonId, taskId, itemId })
      }),
      onResize: function (callback) {
        resizeListeners.set(actionId, callback)
      },
      save: methods && (({ doc, prepare, receive, failure, success }) => {
        const updateDoc = Object.assign({ lessonId, taskId, itemId }, doc)

        callMethod({
          name: methods.save.name,
          args: updateDoc,
          prepare: prepare,
          receive: receive,
          failure: failure,
          success: success
        })
      }),
      dispose: function () {
        if (publications) {
          SubsManager.unsubscribe(publications.byItem.name)
        }

        actions.delete(actionId)
        actionHandlers.delete(actionId)
        resizeListeners.delete(actionId)
        apiMap.delete(actionId)
      }
    }

    apiMap.set(actionId, api)
  }

  return apiMap.get(actionId)
}

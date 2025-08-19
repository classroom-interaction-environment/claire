import { Meteor } from 'meteor/meteor'
import { TaskResults } from '../../../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../../../contexts/tasks/state/TaskWorkingState'
import {
  fromResponse,
  toResponse
} from '../../../../../contexts/tasks/results/TaskResultUtils'
import { delayedCallback } from '../../../../utils/delayedCallback'
import { callMethod } from '../../../../controllers/document/callMethod'

/**
 * Every item implements some common methods that are used to handle the
 * data transportation between the client-side item interaction and the
 * server.
 *
 * These handlers are a standardized way to
 * - load item documents
 * - save responses
 * - move within task pages
 * - indicate the task is finished
 *
 * @locus client
 */
export const ItemHandlers = {}

/**
 * @locus client
 * @param instance {TemplateInstance}
 * @param TaskResultCollection {Mongo.Collection}
 * @return {function}
 */
ItemHandlers.onItemLoad = ({ instance, TaskResultCollection }) =>
  /**
   * TODO rewrite to use Object param instead of param-sequence
   * loads the data for the given item by itemId and restores, if already given,
   * the previously made response from the user.
   *
   * @param itemId {String} the id of the item within the task's content
   * @param callback {function} called when load complete
   * @param page {number} task doc's page, required to search to a response
   * @callback
    */
  function onItemLoad (itemId, callback, page) {
    const taskResultDoc = TaskResultCollection.findOne({ itemId })
    const taskDoc = instance.state.get('taskDoc')
    const taskWorkingDoc = instance.state.get('taskWorkingDoc')

    // we can't continue until all docs have been loaded
    if (!taskResultDoc || !taskDoc || !taskWorkingDoc) {
      return setTimeout(() => callback(null, null), 300)
    }

    const taskId = taskDoc._id
    const { response } = taskResultDoc

    const value = fromResponse({ response, page, itemId, taskId, taskDoc })
    const itemDoc = {
      [itemId]: value,
      updatedAt: taskResultDoc.updatedAt,
      updatedBy: taskResultDoc.updatedBy
    }

    setTimeout(() => callback(null, itemDoc), 300)
  }

/**
 * Creates a new submit handler that allows item to submit responses to the
 * server.
 *
 * @locus client
 * @param instance {TemplateInstance}
 * @return {onItemSubmit}
 */
ItemHandlers.onItemSubmit = ({ instance, onError }) =>

  /**
   * Submits item data for the given item by item id
   * @param itemId {String} the
   * @param insertDoc  {Document} the insert doc for first submition
   * @param updateDoc {Document} the update doc for update submission
   * @param callback {function} the callback to call
   * @callback
    */
  function onItemSubmit ({ itemId, groupMode, insertDoc, updateDoc }, callback) {
    const taskDoc = instance.state.get('taskDoc')
    const taskId = taskDoc._id
    const lessonDoc = instance.state.get('lessonDoc')
    const groupDoc = instance.state.get('groupDoc')
    const lessonId = lessonDoc._id
    const groupId = groupDoc && groupDoc._id
    let value = insertDoc[itemId]

    // if users "delete" their input, for example by
    // removing all text from a text-input then
    // we need to grab the unset value and store empty input
    if (typeof value === 'undefined' && itemId in (updateDoc.$unset ?? {})) {
      value = updateDoc.$unset[itemId]
    }

    const response = toResponse({ value })
    const args = { lessonId, taskId, itemId, response }
    if (groupId) {
      args.groupId = groupId
    }
    if (groupMode) {
      args.groupMode = groupMode
    }

    Meteor.call(TaskResults.methods.saveTask.name, args, delayedCallback(300, (err, taskResultDoc) => {
      if (err) {
        onError(err)
        callback(err)
      }
      taskResultDoc[itemId] = taskResultDoc.response
      callback(null, taskResultDoc)
    }))
  }

ItemHandlers.onTaskPagePrev = ({ instance, onError }) => function onTaskPagePrev ({ page, maxPages, taskId }) {
  window.scrollTo(0, 0)

  saveTask({
    lessonDoc: instance.state.get('lessonDoc'),
    groupDoc: instance.state.get('groupDoc'),
    complete: false,
    progress: ((page + 1) / maxPages) * 100,
    taskId: taskId,
    page: page,
    // handlers
    prepare: () => instance.state.set('taskWorkingReady', false),
    failure: onError,
    success: res => {
      if (!res) return onError(new Error('errors.updateFailed'))
      instance.state.set('invalidateTaskWorkingState', true)
    }
  })
}

ItemHandlers.onTaskPageNext = ({ instance, onError }) => function onTaskPageNext ({ page, maxPages, taskId }) {
  window.scrollTo(0, 0)

  saveTask({
    lessonDoc: instance.state.get('lessonDoc'),
    groupDoc: instance.state.get('groupDoc'),
    complete: false,
    progress: ((page + 1) / maxPages) * 100,
    taskId: taskId,
    page: page,
    // handlers
    prepare: () => instance.state.set('taskWorkingReady', false),
    failure: onError,
    success: res => {
      if (!res) return onError(new Error('errors.updateFailed'))
      instance.state.set('invalidateTaskWorkingState', true)
    }
  })
}

ItemHandlers.onTaskFinished = ({ instance, onError }) => function onTaskFinished ({ page, maxPages, taskId }) {
  window.scrollTo(0, 0)
  saveTask({
    lessonDoc: instance.state.get('lessonDoc'),
    groupDoc: instance.state.get('groupDoc'),
    complete: true,
    progress: 100,
    taskId: taskId,
    page: page,
    // handlers
    prepare: () => instance.state.set('taskWorkingReady', false),
    failure: onError,
    success: res => {
      if (!res) return onError(new Error('errors.updateFailed'))
      instance.state.set('invalidateTaskWorkingState', true)
    }
  })
}

const saveTask = ({ lessonDoc, taskId, page, groupDoc, progress, complete, prepare, receive, failure, success }) => {
  const lessonId = lessonDoc._id
  const args = { lessonId, taskId, complete, page, progress }
  if (groupDoc) {
    args.groupId = groupDoc._id
  }

  callMethod({
    name: TaskWorkingState.methods.saveState,
    args: args,
    prepare: prepare,
    receive: receive,
    failure: failure,
    success: success
  })
}

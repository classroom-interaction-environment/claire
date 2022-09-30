import { Template } from 'meteor/templating'
import { TaskResults } from '../../../../../contexts/tasks/results/TaskResults'
import { TaskWorkingState } from '../../../../../contexts/tasks/results/TaskWorkingState'
import { getCollection } from '../../../../../api/utils/getCollection'
import '../../../../components/profileImage/profileImage'
import './taskProgress.html'

const API = Template.taskProgress.setDependencies({
  contexts: [TaskWorkingState, TaskResults]
})

const TaskWorkingStateCollection = getCollection(TaskWorkingState.name)
const TaskResultsCollection = getCollection(TaskResults.name)
Template.taskProgress.helpers({
  currentProgress () {
    const instance = Template.instance()
    const { userDoc, taskId, lessonId, items } = instance.data

    if (!userDoc || !taskId || !lessonId) {
      return {
        page: 1,
        progress: 0
      }
    }

    const createdBy = userDoc._id
    const stateDoc = TaskWorkingStateCollection.findOne({ createdBy, lessonId, taskId })
    return getProgress({ stateDoc, items, taskId, createdBy })
  },
  offline (userDoc) {
    return !userDoc.presence || !userDoc.presence.status || userDoc.presence.status !== 'online'
  }
})

const getProgress = ({ stateDoc, items, taskId, createdBy }) => {
  if (!stateDoc) {
    return {
      page: 1,
      progress: 0
    }
  }

  if (!items || items.length === 0 || stateDoc.complete) {
    return stateDoc
  }

  const combinedProgress = {
    progress: typeof stateDoc.progress === 'number'
      ? stateDoc.progress
      : 0,
    page: typeof stateDoc.page === 'number'
      ? stateDoc.page + 1
      : 1,
    complete: stateDoc.complete
  }

  // add items percent here
  const max = items.length
  let current = 0

  items.forEach(({ itemId }) => {
    const result = TaskResultsCollection.findOne({ taskId, itemId, createdBy })
    const hasResponse = result?.response?.length > 0
    current += hasResponse ? 1 : 0
  })

  // finally merge items progress and
  // the task working state progress
  const itemsProgress = (current / max) * 100
  combinedProgress.progress = (combinedProgress.progress + itemsProgress) / 2

  return combinedProgress
}
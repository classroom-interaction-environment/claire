import { Template } from 'meteor/templating'
import { TaskWorkingState } from '../../../../../contexts/tasks/results/TaskWorkingState'
import { getCollection } from '../../../../../api/utils/getCollection'
import '../../../../components/profileImage/profileImage'
import './taskProgress.html'

const API = Template.taskProgress.setDependencies({
  contexts: [TaskWorkingState]
})

const TaskWorkingStateCollection = getCollection(TaskWorkingState.name)

Template.taskProgress.helpers({
  currentProgress () {
    const instance = Template.instance()
    const { userDoc } = instance.data
    const { taskId } = instance.data
    const { lessonId } = instance.data

    if (!userDoc || !taskId || !lessonId) {
      return {
        page: 1,
        progress: 0
      }
    }

    const createdBy = userDoc._id
    const stateDoc = TaskWorkingStateCollection.findOne({ createdBy, lessonId, taskId })
    if (!stateDoc) {
      return {
        page: 1,
        progress: 0
      }
    }

    stateDoc.page = typeof stateDoc.page === 'number'
      ? stateDoc.page + 1
      : 1
    return stateDoc
  },
  offline (userDoc) {
    return !userDoc.presence || !userDoc.presence.status || userDoc.presence.status !== 'online'
  }
})

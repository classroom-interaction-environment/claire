import { Template } from 'meteor/templating'
import { TaskWorkingState } from '../../../../../contexts/tasks/state/TaskWorkingState'
import './taskWorkingStatus.html'
import { getCollection } from '../../../../../api/utils/getCollection'

Template.taskWorkingStatus.setDependencies({
  contexts: [TaskWorkingState]
})

const TaskWorkingStateCollection = getCollection(TaskWorkingState.name)

Template.taskWorkingStatus.helpers({
  taskWorkingStateDoc () {
    const instance = Template.instance()
    const { taskId } = instance.data
    const { lessonId } = instance.data
    if (!taskId || !lessonId) return
    return TaskWorkingStateCollection.findOne({ taskId, lessonId })
  }
})

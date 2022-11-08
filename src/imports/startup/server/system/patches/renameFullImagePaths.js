import { Task } from '../../../../contexts/curriculum/curriculum/task/Task'
import { getCollection } from '../../../../api/utils/getCollection'

if (Meteor.settings.patch?.renameFullImagePaths) {
  const TaskCollection = getCollection(Task.name)

  TaskCollection.find().forEach(taskDoc => {

  })
}

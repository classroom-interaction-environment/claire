import { Template } from 'meteor/templating'
import { Task } from '../../../../../contexts/curriculum/curriculum/task/Task'
import './lessonSafeguard.html'
import { getCollection } from '../../../../../api/utils/getCollection'

const API = Template.lessonSafeguard.setDependencies({
  contexts: [Task]
})
const TaskCollection = getCollection(Task.name)

Template.lessonSafeguard.helpers({
  artifacts () {
    return null
  },
  taskDoc (taskId) {
    return TaskCollection.findOne(taskId)
  },
  itemDoc (taskDoc, itemId) {
    let item
    taskDoc.pages.some(page => {
      item = page.content.find(entry => entry.id === itemId)
      return item
    })
    return item
  }
})

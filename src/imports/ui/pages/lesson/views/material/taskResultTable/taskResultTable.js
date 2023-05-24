import { Template } from 'meteor/templating'
import { Item } from '../../../../../../contexts/tasks/definitions/items/Item'
import { Meteor } from 'meteor/meteor'
import { ReactiveVar } from 'meteor/reactive-var'
import { TaskResults } from '../../../../../../contexts/tasks/results/TaskResults'
import { Files } from '../../../../../../contexts/files/Files'
import { cursor } from '../../../../../../api/utils/cursor'
import { $in } from '../../../../../../api/utils/query/inSelector'
import { getCollection } from '../../../../../../api/utils/getCollection'
import { getAllItemsInTask } from '../../../../../../contexts/tasks/getAllItemsInTask'
import { dataTarget } from '../../../../../utils/dataTarget'
import { GroupMode } from '../../../../../../contexts/classroom/group/GroupMode'
import './taskResulTable.html'

const API = Template.taskResultTable.setDependencies({})
Item.initialize().catch(API.notify)
Files.initialize(true)

Template.taskResultTable.onCreated(function () {
  const instance = this
  instance.currentItems = new ReactiveVar()
  const { taskDoc, userIds } = instance.data
  instance.state.set({
    showItems: {},
    userIds,
    taskDoc
  })

  // wait until items are initialized and then resolve all items
  // for the current taskDoc
  instance.autorun(computation => {
    if (!Item.isInitialized() || !Files.isInitialized()) {
      return
    }

    instance.currentItems.set(getAllItemsInTask(taskDoc))
    computation.stop()
  })
})

Template.taskResultTable.helpers({
  loadComplete () {
    return API.initComplete()
  },
  showItems (userId) {
    return Template.getState('showItems')[userId]
  },
  groupMode (mode) {
    const groupMode = GroupMode[mode]
    if (!groupMode || groupMode === GroupMode.off) {
      return null
    }
    return groupMode
  },
  users () {
    const userIds = Template.getState('userIds') || []
    return cursor(() => Meteor.users.find({ _id: $in(userIds) }, {
      sort: {
        'presence.status': -1,
        lastName: 1
      }
    }))
  },
  currentItems () {
    return Template.instance().currentItems.get()
  },
  taskResultDoc (itemId, taskId, createdBy) {
    return getCollection(TaskResults.name).findOne({ taskId, itemId, createdBy })
  }
})

Template.taskResultTable.events({
  'click .show-items-btn' (event, templateInstance) {
    event.preventDefault()
    const userId = dataTarget(event, templateInstance)
    const showItems = templateInstance.state.get('showItems')
    showItems[userId] = !showItems[userId]
    templateInstance.state.set({ showItems })
  }
})

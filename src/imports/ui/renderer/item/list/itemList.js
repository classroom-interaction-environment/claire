import { Template } from 'meteor/templating'
import { Item } from '../../../../contexts/tasks/definitions/items/Item'
import { ResponseProcessorLoader } from '../../../../contexts/tasks/responseProcessors/ResponseProcessorLoader'
import { Files } from '../../../../contexts/files/Files'
import { getAllItemsInTask } from '../../../../contexts/tasks/getAllItemsInTask'
import '../../../generic/nodocs/nodocs'
import './itemList.html'

// The itemList is a renderer that automatically extracts and renders all items
// of a given task document including their resolved contexts and response
// processors.

const API = Template.itemList.setDependencies({})
Item.initialize().catch(API.notify)
Files.initialize(true)

const rpInit = ResponseProcessorLoader.initialize({
  onError: API.notify,
  onComplete: () => API.log('rp initialized')
})
Item.initialize()
  .catch(API.notify)
  .then(() => API.log('items initialized'))

Template.itemList.helpers({
  loadComplete () {
    return Item.isInitialized() && Files.isInitialized() && rpInit.get()
  },
  itemsInTask () {
    const { taskDoc } = Template.instance().data
    return taskDoc && getAllItemsInTask(taskDoc)
  }
})

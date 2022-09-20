import { Template } from 'meteor/templating'
import { TaskDefinitions } from '../../../../../tasks/definitions/TaskDefinitions'
import { isMaterial } from '../../../../../material/isMaterial'
import { getMaterialRenderer } from '../../../../../../api/material/getMaterialRenderer'
import './taskRenderer'
import './taskRendererFactory.html'

const API = Template.TaskRendererFactory.setDependencies()

// if the TaskDefinitions have not been initialized before,
// then this is the latest point, where it should be done
// in order to correctly display defined elements and items
const init = TaskDefinitions.initialize()

Template.TaskRendererFactory.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    const { type, meta } = data
    const target = getTarget(type, meta)
    const ctx = TaskDefinitions.helpers.getCategory(target)

    const renderer = isMaterial(ctx)
      ? getMaterialRenderer(ctx.material, 'task')
      : ctx.renderer
    const { template, load } = renderer
    API.log('load renderer', template)

    load()
      .catch(error => instance.setState({ error }))
      .then(() => instance.setState({ [target]: { template } }))
  })
})

Template.TaskRendererFactory.helpers({
  template (type, meta) {
    const target = getTarget(type, meta)
    const targetData = Template.getState(target)
    return targetData?.template
  },
  initialized (type, meta) {
    const target = getTarget(type, meta)
    return init.get() && Template.getState(target)
  },
  supported (element) {
    return init.get() && TaskDefinitions.helpers.isRegistered(element)
  }
})

const getTarget = (type, meta) => meta || type

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
const loadedRenderer = new Set()

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

    if (!loadedRenderer.has(template)) {
      API.log('load renderer', template, data)
      load()
        .catch(error => instance.state.set({ error }))
        .then(() => {
          instance.state.set(target, { template })
          loadedRenderer.add(template)
        })
    }

    // if we have loaded the template once, but
    // it's currently not defined in this instance' state
    // we add it to the state
    else {
      const hasTarget = Tracker.nonreactive(() => instance.state.get(target))
      if (!hasTarget) {
        instance.state.set(target, { template })
      }
    }
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

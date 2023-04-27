import { ContentTypes } from './lib/contentTypes'
import { onClientExec } from '../../../api/utils/archUtils'
import { LinkedResource } from './linked/LinkedResource'
import { EmbeddedResource } from './embedded/EmbeddedResource'
import { Literature } from './literature/Literature'

export const WebResources = {}

WebResources.name = 'webresources'
WebResources.label = 'webResources.title'
WebResources.icon = 'globe'

/**
 * @deprecated use ITaskDefinition interface
 */
WebResources.contexts = {
  linkedResource: LinkedResource,
  embeddedResource: EmbeddedResource,
  literature: Literature
}

WebResources.renderer = {
  template: 'webResourceRenderer',
  load: async function () {
    return import('./renderer/webResourceRenderer')
  }
}

WebResources.helpers = {
  typesValues () {
    if (!this._types) {
      this._types = Object.values(ContentTypes)
    }
    return this._types
  }
}

/// /////////////////////////////////////////////////////////////////////////////////////////////
//
//  CLIENT
//
/// /////////////////////////////////////////////////////////////////////////////////////////////

onClientExec(function () {
  import { ReactiveVar } from 'meteor/reactive-var'
  import { ITaskDefinition } from '../../tasks/definitions/ITaskDefinition'
  const init = new ReactiveVar(false)

  async function initialize () {
    if (init.get()) return true
    await import('./renderer/webResourceRenderer')
    return true
  }

  /**
   * @deprecated
   * @param initContexts
   */
  WebResources.initialize = function (initContexts) {
    if (!init.get()) {
      initialize()
        .then(res => {
          if (initContexts) {
            initContexts(WebResources.getMaterialContexts())
          }
          init.set(res)
        })
        .catch(e => console.error(e))
    }
    return init
  }

  const contextMap = new Map(Object.entries(WebResources.contexts))

  ITaskDefinition(WebResources, contextMap)
})

import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'
import { getItemBase } from '../items/getItemBase'
import { option } from '../common/helpers'
import { ITaskDefinition } from '../ITaskDefinition'
import { createLog } from '../../../../api/log/createLog'
import { ReactiveVar } from 'meteor/reactive-var'
import { H5PMeteor } from 'meteor/claire:h5p'
import { callMethod } from '../../../../ui/controllers/document/callMethod'

export const H5P = {}

const debug = createLog({ name: 'H5PItems', type: 'debug' })

H5P.name = 'h5p'
H5P.label = 'h5p.title'
H5P.types = {}
H5P.icon = 'edit'
H5P.options = {}
H5P.dataTypes = Object.assign({}, ResponseDataTypes)
H5P.categories = new Map()

H5P.categories.set('notCategorized', {
  name: 'notCategorized',
  label: 'h5pTypes.notCategorized',
  icon: 'minus',
  base: getItemBase().name
})

const contexts = new Map()

H5P.register = function (h5pContentType) {
  debug('register', h5pContentType.machineName, h5pContentType)

  const context = {
    name: h5pContentType.machineName,
    label: h5pContentType.title,
    dataType: null,
    iconUrl: h5pContentType.icon,
    schema: {
      contentId: String,
      autoform: {
        type: 'text',
        h5p: h5pContentType
      }
    },
    publicFields: {
      contentId: 1
    },
    build: h5pDoc => ({
      [h5pDoc.contentId]: {
        type: String,
        autoform: {
          type: 'text'
        }
      }
    }),
    form: async () => {
      // import autoform editor template
    }
  }

  contexts.set(context.name, context)
}

H5P.options = () => Array.from(contexts.values()).map(el => option(el))

H5P.renderer = {
  template: 'h5pPlayer',
  load: async function () {
    return import('../../../../ui/h5p/player/h5pPlayer')
  }
}

const initialized = new ReactiveVar(false)

H5P.isInitialized = function () {
  return initialized.get()
}

H5P.initialize = async () => {
  debug('initialize')
  if (initialized.get()) {
    return true
  }

  const response = await callMethod({
    name: H5PMeteor.methods.listItems.name,
    args: {}
  })

  response.libraries.forEach(lib => {
    H5P.register(lib)
  })
}

ITaskDefinition(H5P, contexts)

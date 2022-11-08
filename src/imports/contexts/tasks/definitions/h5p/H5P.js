import { ResponseDataTypes } from '../../../../api/plugins/ResponseDataTypes'
import { getItemBase } from '../items/getItemBase'
import { option } from '../common/helpers'
import { ITaskDefinition } from '../ITaskDefinition'

export const H5P = {}

H5P.name = 'h5p'
H5P.label = 'h5p.title'
H5P.types = {}
H5P.icon = 'square-5'
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

H5P.register = function (context) {
  contexts.set(context.name, context)
}
H5P.options = () => Array.from(contexts.values()).map(el => option(el))

H5P.renderer = {
  template: 'h5pPRenderer',
  load: async function () {
    // return import('../../../../ui/renderer/item/itemRenderer')
  }
}

H5P.initialize = async () => {}

ITaskDefinition(H5P, contexts)

import { Material } from './Material'
import { getCollection } from '../../api/utils/getCollection'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { getMaterialRenderer } from '../../api/material/getMaterialRenderer'

export const createMaterialPreview = async ({ docId, contextName, templateInstance }) => {
  const ctx = Material.get(contextName)
  const renderer = getMaterialRenderer(ctx.material)
  const template = renderer.template
  const document = getLocalCollection(contextName).findOne(docId) ||
    getCollection(contextName).findOne(docId)

  await renderer.load()

  const title = document.title || document.name
  const materialDoc = { name: contextName }
  const data = renderer.data({ materialDoc, document, templateInstance })

  return { title, ctx, template, data }
}

import { Material } from './Material'
import { getCollection } from '../../api/utils/getCollection'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { getMaterialRenderer } from '../../api/material/getMaterialRenderer'

/**
 * Gathers all necessary parts to assemble a preview for a given material.
 * First it loads the preview respective renderer.
 * Then it builds the correct input data for the renderer and returns all parts contained in an Object.
 * @param docId
 * @param contextName
 * @param templateInstance
 * @return {Promise<{template: string, data: object, ctx: object, title: string}>}
 */
export const createMaterialPreview = async ({ docId, contextName, templateInstance }) => {
  const ctx = Material.get(contextName)
  const rendererName = 'preview'
  const renderer = getMaterialRenderer(ctx.material, rendererName)
  const template = renderer.template
  const document =
    getLocalCollection(contextName).findOne(docId) ||
    getCollection(contextName).findOne(docId)

  await renderer.load()

  const title = document.title || document.name
  const materialDoc = { name: contextName }
  const options = { preview: true }
  const data = renderer.data({ materialDoc, document, options, templateInstance })

  return { title, ctx, template, data }
}

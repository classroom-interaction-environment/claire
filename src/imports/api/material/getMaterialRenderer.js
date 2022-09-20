/**
 * Returns a renderer for a material context
 * @param material {Object} the material definitions of a context
 * @param rendererName {String} the name of the desired renderer
 * @return {Renderer|undefined} a renderer definitions object, if found
 */
export const getMaterialRenderer = (material, rendererName = 'main') => {
  const allRenderer =  material?.renderer
  if (!allRenderer) return

  const renderer = allRenderer[rendererName]
  if (renderer) return renderer

  return allRenderer.main
}

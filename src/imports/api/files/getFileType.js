import { ContextRegistry } from '../../infrastructure/context/ContextRegistry'

/**
 * @deprecated fix fileType and fileCtx
 *
 * extracts the Files context from the name.
 * TODO we need to review the item documents' fileType entry
 * TODO because it should be renamed to fileCtx while
 * TODO fileType really refers to a {FileTypes} entry
 * TODO like: { fileCtx: 'imageFiles', fileType: 'image' }
 * TODO this would also support multiple contexts for images
 * TODO and a proper association with GridFS buckets
 */
export const getFileType = fileTypeCtxName => {
  const ctx = ContextRegistry.get(fileTypeCtxName)
  if (ctx) return ctx.files.type

  return fileTypeCtxName
}

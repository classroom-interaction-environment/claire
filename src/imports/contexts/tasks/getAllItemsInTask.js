import { Item } from './definitions/items/Item'
import { getResponseProcessors } from '../../api/response/getResponseProcessors'
import { getFileType } from '../../api/files/getFileType'
import { Files } from '../files/Files'

/**
 * Extracts all items from a given taskDoc
 *
 * @param taskDoc
 * @returns {*[]}
 */
export const getAllItemsInTask = taskDoc => {
  if (!Item.isInitialized() || !Files.isInitialized()) {
    throw new Error('Items and Files need to be initialized to get all items in task')
  }

  const items = []
  if (!taskDoc) return items

  const pages = taskDoc.pages
  if (!pages) return items

  pages.forEach(page => {
    const { content } = page
    if (!content) return

    content.forEach(entry => {
      if (entry.itemId) {
        const fileType = getFileType(entry.fileType) || entry.fileType
        entry.context = Item.get(entry.meta)
        entry.responseProcessors = getResponseProcessors({
          dataType: entry.context.dataType,
          fileType: fileType
        })

        // files require an additional renderer or we will preview only ids of the files
        if (fileType) {
          Files.renderer.load().catch(e => console.error(e))
          entry.renderer = { template: Files.renderer.template }

          const filesCtx = Files.get(entry.fileType)
          entry.renderer.data = fileId => {
            return { _id: fileId, meta: entry.fileType, version: filesCtx.files.previewVersion }
          }
        }

        items.push(entry)
      }
    })
  })
  return items
}

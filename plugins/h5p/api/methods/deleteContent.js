import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

/**
 * Deletes the H5P content. Call this method from your own custom UI
 * component.
 * @param {strings} contentId
 * @returns {boolean} true if deleting was successful
 */
export const deleteContent = async function ({ contentId }) {
  return await H5PFactory.editor().deleteContent(contentId, new H5PUser(this.user))
}

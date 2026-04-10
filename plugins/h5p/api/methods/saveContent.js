import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

/**
 * Persists changes to a content or saves a newly created piece of content.
 * Call this Meteor method from H5PEditorComponent.saveContentCallback.
 * @param {any} params the parameters received from the H5P editor
 * @param {IContentMetadata} metadata the metadata received from the H5P
 * editor
 * @param {string} library the main library ubername
 * @param {string|null} contentId (optional) the contentId (if already saved)
 * @returns a structure with the (newly assigned) content id and the
 * metadata of the content
 */
export const saveContent = async function ({ params, metadata, library, contentId }) {
  const { id: newContentId, metadata: newMetadata } = await H5PFactory.editor().saveOrUpdateContentReturnMetaData(
    contentId === null ? undefined : contentId,
    params,
    metadata,
    library,
    new H5PUser(this.user) // get the real user from Mongo and inject it here
  )
  return { contentId: newContentId, metadata: newMetadata }
}

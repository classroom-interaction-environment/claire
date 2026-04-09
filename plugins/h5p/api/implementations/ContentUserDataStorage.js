import { H5PUserContentCollection } from '../collections/H5PUserContentCollection'
import { H5PFinishedUserDataCollection } from '../collections/H5PFinishedUserDataCollection'

export default class ContentUserDataStorage {
  /**
   * Creates or updates the content user data.
   */
  async createOrUpdateContentUserData (userData) {
    const { contentId, userId, subContentId } = userData
    H5PUserContentCollection.upsert({ contentId, userId, subContentId }, { $set: userData })
  }

  /**
   * Deletes all content userData which has the invalidate field set to true.
   * This method is called from the editor when content is changed and the
   * saved contentUserData becomes invalidated.
   * @param contentId The id of the content which to delete
   */
  async deleteInvalidatedContentUserData (contentId) {
    H5PUserContentCollection.remove({ contentId, invalidate: true })
  }

  /**
   * Deletes a contentUserData object. (Useful for implementing GDPR rights
   * functionality.) Throws errors if something goes wrong.
   * @param user the user of the content user data that should be deleted
   */
  async deleteAllContentUserDataByUser (user = {}) {
    const userId = user.id
    H5PUserContentCollection.remove({ userId })
  }

  /**
   * Deletes all userContentData objects for a given contentId. (Used when
   * deleting content) Throws errors if something goes wrong.
   * @param contentId The content id to delete.
   */
  async deleteAllContentUserDataByContentId (contentId) {
    H5PUserContentCollection.remove({ contentId })
  }

  /**
   * Loads the contentUserData for given contentId, dataType and subContentId
   * @param contentId The id of the content to load user data from
   * @param dataType Used by the h5p.js client
   * @param subContentId The id provided by the h5p.js client call
   * @param user The user who owns this object
   * @returns the data
   */
  async getContentUserData (contentId, dataType, subContentId, user = {}) {
    const userId = user.id
    return H5PUserContentCollection.findOne({ contentId, dataType, subContentId, userId })
  }

  /**
   * Lists all associated contentUserData for a given contentId and user.
   * @param contentId The id of the content to load user data from
   * @param user The id of the user to load user data from
   * @returns An array of objects containing the dataType, subContentId and
   the contentUserState as string in the data field.
   */
  async getContentUserDataByContentIdAndUser (contentId, user = {}) {
    const userId = user.id
    return H5PUserContentCollection.find({ contentId, userId }).fetch()
  }

  /**
   * Retrieves all contentUserData for a given user (Useful for implementing
   * GDPR rights functionality.)
   * @param user the user for which the contentUserData should be retrieved.
   */
  async getContentUserDataByUser (user = {}) {
    const userId = user.id
    return H5PUserContentCollection.find({ userId }).fetch()
  }

  /**
   * Saves data when a user completes content or replaces the previous
   * finished data.
   */
  async createOrUpdateFinishedData (finishedData) {
    const { contentId, userId } = finishedData
    H5PFinishedUserDataCollection.schema().validate(finishedData)
    H5PFinishedUserDataCollection.upsert({ contentId, userId }, { $set: finishedData })
  }

  /**
   * Gets the finished data of all users for a specific piece of content.
   */
  async getFinishedDataByContentId (contentId) {
    return H5PFinishedUserDataCollection.find({ contentId }).fetch()
  }

  /**
   * Gets all finished user data for a specific user (across all content
   * objects). (Useful for implementing GDPR rights functionality.)
   */
  async getFinishedDataByUser (user) {
    const userId = user.id
    return H5PFinishedUserDataCollection.find({ userId }).fetch()
  }

  /**
   * Deletes all finished user data of a content object. (Called when the
   * content object is deleted)
   */
  async deleteFinishedDataByContentId (contentId) {
    H5PFinishedUserDataCollection.remove({ contentId })
  }

  /**
   * Deletes all finished user data for a specific user (across all content
   * objects). (Useful for implementing GDPR rights functionality.)
   */
  async deleteFinishedDataByUser (user) {
    const userId = user.id
    return H5PFinishedUserDataCollection.remove({ userId })
  }

  async loadContentUserData (contentId, dataType, subContentId, user) {
    throw new Error('not implemented')
  }

  async saveContentUserData (contentId, dataType, subContentId, userState, invalidate, preload, user) {
    throw new Error('not implemented')
  }

  async saveFinishedDataForUser (contentId, score, maxScore, opened, finished, time, user) {
    throw new Error('not implemented')
  }

  async deleteContentUserDataByUserId (contentId, userId, requestingUser) {
    this.userData = this.userData.filter(
      (data) => data.contentId !== contentId && data.userId !== userId
    )
  }

  async listByContent (contentId, userId) {
    return Promise.resolve(
      this.userData.filter(
        (data) => data.contentId === contentId && data.userId === userId
      )
    )
  }
}

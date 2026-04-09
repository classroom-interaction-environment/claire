import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

/**
 * Gets the data needed to render the player with
 * @lumieducation/h5p-webcomponents. Call this Meteor method from
 * H5PPlayerComponent.loadContentCallback.
 * @param {string} contentId  the content id to load
 * @returns the data that must be passed to the player webcomponent
 */
export const loadContentForPlaying = async function ({ contentId }) {
  return H5PFactory.player().render(contentId, new H5PUser(this.user))
}

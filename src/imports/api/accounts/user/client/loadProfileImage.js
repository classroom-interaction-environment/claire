import { ProfileImages } from '../../../../contexts/files/image/ProfileImages'
import { loadIntoCollection } from '../../../../infrastructure/loading/loadIntoCollection'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'

/**
 * Loads the current users profile image into the local collection
 * @param user
 * @param onError
 * @param onSuccess
 */
export const loadProfileImage = ({ user, onError = console.error, onSuccess = () => {} }) => {
  loadIntoCollection({
    name: ProfileImages.methods.my,
    collection: getLocalCollection(ProfileImages.name),
    failure: error => onError(ProfileImages.methods.my.name, error),
    debug: true,
    success: () => {
      user.profileImageReady = true
      onSuccess()
    }
  })
}

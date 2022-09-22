import { ProfileImages } from '../../../../contexts/files/image/ProfileImages'
import { getLocalCollection } from '../../../../infrastructure/collection/getLocalCollection'

export const hasProfileImageLoaded = (profileImage) => getLocalCollection(ProfileImages.name).find(profileImage).count() > 0

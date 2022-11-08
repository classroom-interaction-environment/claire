import { Meteor } from 'meteor/meteor'
import { userExists } from '../../../../../api/accounts/user/userExists'

/**
 * Updates the user's profile. Picks only the defined arguments for the update call.
 * @param userId {string} required, the _id of the user
 * @param profileImage {string=} optional _id of the profileImage
 * @param firstName {string=} optional, new first name of the user
 * @param lastName {string=} optional, new last name of the user
 * @param locale {string=} optional, new locale iso code
 * @return {number} 1 if updated, 0 of not
 */
export const updateProfile = function updateProfile ({ userId, profileImage, firstName, lastName, locale }) {
  if (!userExists({ userId })) {
    throw new Meteor.Error('errors.403', 'user.updateProfile', 'user.userNotFound')
  }

  const updateDoc = {}

  // we could unset profile image using a 'null' value, which is why we
  // can't use a simple truthy check here
  if (typeof profileImage !== 'undefined') {
    updateDoc.profileImage = profileImage
  }
  if (firstName) {
    updateDoc.firstName = firstName
  }
  if (lastName) {
    updateDoc.lastName = lastName
  }
  if (locale) {
    updateDoc.locale = locale
  }

  return Meteor.users.update(userId, { $set: updateDoc })
}

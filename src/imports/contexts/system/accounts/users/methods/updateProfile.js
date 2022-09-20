import { Meteor } from "meteor/meteor"
import { userExists } from '../../../../../api/accounts/user/userExists'

export const updateProfile = function updateProfile ({ userId, profileImage, firstName, lastName }) {
  if (!userExists({ userId })) {
    throw new Meteor.Error('errors.403', 'user.updateProfile', 'user.userNotFound')
  }

  const query = {}

  // we could unset profile image using a 'null' value, which is why we
  // can't use a simple truthy check here
  if (typeof profileImage !== 'undefined') {
    query.profileImage = profileImage
  }
  if (firstName) {
    query.firstName = firstName
  }
  if (lastName) {
    query.lastName = lastName
  }

  return Meteor.users.update(userId, { $set: query })
}

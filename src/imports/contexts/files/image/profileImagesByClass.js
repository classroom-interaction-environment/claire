import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../api/utils/getCollection'

/**
 * Gets all profile images (docs, not binary), linked to all
 * users of a given class.
 * @return {function({classId?: *}): *}
 */
export const profileImagesByClass = function () {
  // initialization phase
  import { SchoolClass } from '../../classroom/schoolclass/SchoolClass'
  import { ProfileImages } from './ProfileImages'

  // run phase
  return function ({ classId, skip }) {
    const classDoc = getCollection(SchoolClass.name).findOne(classId)
    if (!classDoc) {
      throw new Meteor.Error('errors.docNotFound', classId)
    }
    if (!classDoc.createdBy === this.userId && !UserUtils.isAdmin()) {
      throw new Meteor.Error('errors.permissionDenied', classId)
    }
    const students = classDoc.students || []
    const teachers = classDoc.teachers || []
    const allUsersImages = students
      .concat(teachers)
      .map(userId => (Meteor.users.findOne(userId) || {}).profileImage)
      .filter(profileImageId => !!profileImageId)

    const query = { _id: { $in: allUsersImages } }
    if (skip && skip.length > 0) {
      query._id.$nin = skip
    }

    return getCollection(ProfileImages.name)
      .find(query)
      .fetch()
  }
}

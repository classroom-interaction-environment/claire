import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../../../api/utils/getCollection'

export const usersByClass = function () {
  import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'

  // run phase
  return function usersByClass ({ classId, skip }) {
    const classDoc = getCollection(SchoolClass.name).findOne(classId)
    if (!classDoc) {
      throw new Meteor.Error('usersByClass.failed', 'errors.docNotFound', classId)
    }

    const allStudents = (classDoc.students || [])
    const allTeachers = (classDoc.teachers || [])
    const allUsers = allStudents.concat(allTeachers)

    const { userId } = this
    const isOwner = userId && (classDoc.createdBy === userId)
    const isMember = !isOwner && allUsers.includes(userId)

    if (!isOwner && !isMember) {
      throw new Meteor.Error('usersByClass.failed', 'errors.permissionDenied', classId)
    }

    const projection = {
      fields: {
        emails: 0,
        services: 0
      },
      limit: allUsers.length
    }

    const query = { _id: { $in: allUsers } }

    if (skip && skip.length > 0) {
      query._id.$nin = skip
    }

    return Meteor.users.find(query, projection)
  }
}

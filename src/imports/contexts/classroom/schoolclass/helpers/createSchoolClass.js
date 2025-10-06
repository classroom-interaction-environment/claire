import { getCollection } from '../../../../api/utils/getCollection'
import { Meteor } from 'meteor/meteor'
import { SchoolClass } from '../SchoolClass'

export const createSchoolClass = async ({ title, timeFrame, userId   }) => {
  const SchoolClassCollection = getCollection(SchoolClass.name)
  const insert = { title, createdBy: userId }

  if (await SchoolClassCollection.countDocuments(insert) > 0) {
    throw new Meteor.Error('create.error', 'schoolClass.exists', {
      key: 'title',
      type: 'valueAlreadyExists',
      value: title
    })
  }

  if (timeFrame) {
    insert.timeFrame = timeFrame
  }

  insert.students = []
  insert.teachers = [userId]

  return SchoolClassCollection.insertAsync(insert)
}
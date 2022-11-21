import { Lesson } from '../../../classroom/lessons/Lesson'
import { getCollection } from '../../../../api/utils/getCollection'
import { Meteor } from 'meteor/meteor'
import { TaskWorkingState } from '../TaskWorkingState'

export const taskWorkingStateByLesson = function ({ lessonId }) {
  const { userId } = this
  if (!Lesson.helpers.isMemberOfLesson({ userId, lessonId })) {
    throw new Meteor.Error('errors.noClassMember')
  }
  return getCollection(TaskWorkingState.name).find({ lessonId })
}

import { getCollection } from '../../../../api/utils/getCollection'
import { Meteor } from 'meteor/meteor'
import { TaskWorkingState } from '../TaskWorkingState'
import { LessonHelpers } from '../../../classroom/lessons/LessonHelpers'

export const taskWorkingStateByLesson = function ({ lessonId }) {
  const { userId } = this
  if (!LessonHelpers.isMemberOfLesson({ userId, lessonId })) {
    throw new Meteor.Error('errors.noClassMember')
  }
  return getCollection(TaskWorkingState.name).find({ lessonId })
}

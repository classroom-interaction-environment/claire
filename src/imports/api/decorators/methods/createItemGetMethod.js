import { onServer } from '../../utils/archUtils'
import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../utils/getCollection'

export const createItemGetMethod = ({ name }) => {
  import { isMemberOfLesson } from '../../../contexts/classroom/lessons/runtime/isMemberOfLesson'

  return {
    name: `${name}.methods.get`,
    schema: {
      lessonId: String,
      taskId: String,
      itemId: String
    },
    run: onServer(function run ({ lessonId, taskId, itemId }) {
      const userId = this.userId
      // TODO decouple isMemberOfLesson from lesseon
      if (!isMemberOfLesson({ userId, lessonId })) {
        throw new Meteor.Error('schoolClass.errors.noMember')
      }

      return getCollection(name).findOne({ lessonId, taskId, itemId })
    })
  }
}

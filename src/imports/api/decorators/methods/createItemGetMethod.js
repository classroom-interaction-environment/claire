import { onServer } from '../../utils/archUtils'
import { Meteor } from 'meteor/meteor'
import { getCollection } from '../../utils/getCollection'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'

export const createItemGetMethod = ({ name }) => {
  const { isMemberOfLesson } = require('../../../contexts/classroom/lessons/runtime/isMemberOfLesson')
  const { createDocGetter } = require('../../utils/document/createDocGetter')
  const getLessonDoc = createDocGetter({ name: Lesson.name })
  return {
    name: `${name}.methods.get`,
    schema: {
      lessonId: String,
      taskId: String,
      itemId: String
    },
    run: onServer(async function run ({ lessonId, taskId, itemId }) {
      const { userId } = this
      const lessonDoc = await getLessonDoc(lessonId)
      if (!await isMemberOfLesson({ userId, lessonDoc })) {
        throw new Meteor.Error('schoolClass.errors.noMember')
      }

      return getCollection(name).findOneAsync({ lessonId, taskId, itemId })
    })
  }
}

import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'

export const createByLessonPublication = ({ name }) => {
  const { isMemberOfLesson } = require('../../../contexts/classroom/lessons/runtime/isMemberOfLesson')
  const { createDocGetter } = require('../../utils/document/createDocGetter')
  const getLessonDoc = createDocGetter({ name: Lesson.name, optional: false })

  return {
    name: `${name}.publication.byLesson`,
    schema: { lessonId: String },
    run: onServer(async function ({ lessonId }) {
      const userId = this.userId
      const lessonDoc = await getLessonDoc(lessonId)
      if (!await isMemberOfLesson({ userId, lessonDoc })) {
        throw new Meteor.Error('schoolClass.errors.noMember')
      }

      const query = { lessonId }
      const projection = {
        fields: {
          lessonId: 1,
          taskId: 1,
          itemId: 1
        }
      }
      return getCollection(name).find(query, projection)
    })
  }
}

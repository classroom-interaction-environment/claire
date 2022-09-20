import { Meteor } from "meteor/meteor"
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'

export const createByLessonPublication = ({ name }) => {
  import { isMemberOfLesson } from '../../../contexts/classroom/lessons/runtime/isMemberOfLesson'
  return {
    name: `${name}.publication.byLesson`,
    schema: { lessonId: String },
    run: onServer(function ({ lessonId }) {
      const userId = this.userId
      if (!isMemberOfLesson({ userId, lessonId })) {
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
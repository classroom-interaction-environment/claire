import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { createLog } from '../../log/createLog'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'

export const createByItemPublication = ({ name }) => {
  const { isMemberOfLesson } = require('../../../contexts/classroom/lessons/runtime/isMemberOfLesson')
  const { createDocGetter } = require('../../utils/document/createDocGetter')
  const getLessonDoc = createDocGetter({ name: Lesson.name, optional: false })
  log('[createByItemPublication]:', name)
  return {
    name: `${name}.publications.byItem`,
    schema: {
      lessonId: String,
      taskId: String,
      itemId: String
    },
    run: onServer(async function ({ lessonId, taskId, itemId }) {
      const userId = this.userId
      const lessonDoc = await getLessonDoc(lessonId)
      if (!await isMemberOfLesson({ userId, lessonDoc })) {
        const err = new Meteor.Error('schoolClass.errors.noMember')
        logError(err)
        throw err
      }
      const query = { lessonId, itemId, taskId }
      const projection = { limit: 1 }
      // log(`[${name}.publications.byItem]: `, getCollection(name).find(query, projection).count())
      return getCollection(name).find(query, projection)
    })
  }
}

const log = createLog({ name: createByItemPublication.name })
const logError = createLog({ name: createByItemPublication.name, type: 'error' })

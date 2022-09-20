import { Meteor } from "meteor/meteor"
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { createLog } from '../../log/createLog'



export const createByItemPublication = ({name}) => {
  import { isMemberOfLesson } from '../../../contexts/classroom/lessons/runtime/isMemberOfLesson'

  log('[createByItemPublication]:', name)
  return {
    name: `${name}.publications.byItem`,
    schema: {
      lessonId: String,
      taskId: String,
      itemId: String
    },
    run: onServer(function ({ lessonId, taskId, itemId }) {
      const userId = this.userId
      if (!isMemberOfLesson({ userId, lessonId })) {
        const err = new Meteor.Error('schoolClass.errors.noMember')
        logError(err)
        throw err
      }
      const query = { lessonId, itemId, taskId }
      const projection = { limit: 1 }
      log(`[${name}.publications.byItem]: `, getCollection(name).find(query, projection).count())
      return getCollection(name).find(query, projection)
    })
  }
}

const log = createLog({ name: createByItemPublication.name })
const logError = createLog({ name: createByItemPublication.name, type: 'error' })

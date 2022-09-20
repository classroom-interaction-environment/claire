import { getCollection } from '../../../utils/getCollection'
import { onServer } from '../../../utils/archUtils'

export const createFilesByItemPublication = ({ name }) => ({
  byItem: {
    name: `${name}.publications.byItem`,
    schema: {
      lessonId: String,
      taskId: String,
      itemId: String
    },
    run: onServer(function ({ lessonId, taskId, itemId }) {
      const query = {
        'meta.lessonId': lessonId,
        'meta.taskId': taskId,
        'meta.itemId': itemId
      }
      return getCollection(name).find(query)
    })
  }
})

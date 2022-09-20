import { getCollection } from '../../../utils/getCollection'
import { onServer } from '../../../utils/archUtils'

export const createMyFilesPublication = ({ name }) => ({
  my: {
    name: `${name}.publications.my`,
    schema: {
      meta: {
        type: Object,
        optional: true,
      },
      'meta.lessonId': { type: String, optional: true },
      'meta.taskId': { type: String, optional: true },
      'meta.itemId': { type: String, optional: true }
    },
    run: onServer(function ({ meta = {} }) {
      const { lessonId, taskId, itemId } = meta
      const userId = this.userId

      const query = { userId }

      if (lessonId) query.lessonId = lessonId
      if (taskId) query.taskId = taskId
      if (itemId) query.itemId = itemId

      return getCollection(name).find({ userId })
    })
  }
})

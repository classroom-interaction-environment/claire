import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'
import { createDocGetter } from '../../utils/document/createDocGetter'
import { isMemberOfLesson } from '../../../contexts/classroom/lessons/runtime/isMemberOfLesson'
import { Lesson } from '../../../contexts/classroom/lessons/Lesson'

export const createResponseProcessorSaveMethod = ({ name, schema }) => {
  const getLessonDoc = createDocGetter({ name: Lesson.name })
  return {
    name: `${name}.methods.saveResponseProduct`,
    schema: schema,
    run: onServer(async function run ({ lessonId, taskId, itemId, ...customFields }) {
      const { userId } = this
      const lessonDoc = await getLessonDoc(lessonId)
      if (!await isMemberOfLesson({ userId, lessonDoc })) {
        throw new Meteor.Error('schoolClass.errors.noMember')
      }

      const Collection = getCollection(name)
      const document = await Collection.findOneAsync({ lessonId, taskId, itemId })
      if (!document) {
        const insertDoc = Object.assign({
          lessonId,
          taskId,
          itemId
        }, customFields)
        return Collection.insertAsync(insertDoc)
      }

      // TODO consider delegation by roles
      if (document.createdBy !== userId) {
        throw new Meteor.Error('errors.permissionDenied')
      }

      return Collection.updateAsync(document._id, { $set: customFields })
    })
  }
}

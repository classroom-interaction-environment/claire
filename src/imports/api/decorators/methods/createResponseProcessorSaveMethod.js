import { Meteor } from 'meteor/meteor'
import { onServer } from '../../utils/archUtils'
import { getCollection } from '../../utils/getCollection'


export const createResponseProcessorSaveMethod = function ({ name, schema }) {
  import { isMemberOfLesson } from '../../../contexts/classroom/lessons/runtime/isMemberOfLesson'

  return {
    name: `${name}.methods.saveResponseProduct`,
    schema: schema,
    run: onServer(function run ({ lessonId, taskId, itemId, ...customFields }) {
      const userId = this.userId
      if (!isMemberOfLesson({ userId, lessonId })) {
        throw new Meteor.Error('schoolClass.errors.noMember')
      }

      const Collection = getCollection(name)
      const document = Collection.findOne({ lessonId, taskId, itemId })
      if (!document) {
        const insertDoc = Object.assign({
          lessonId,
          taskId,
          itemId
        }, customFields)
        return Collection.insert(insertDoc)
      }

      // TODO consider delegation by roles
      if (document.createdBy !== this.userId) {
        throw new Meteor.Error('errors.permissionDenied')
      }

      return Collection.update(document._id, { $set: customFields })
    })
  }
}

import { Meteor } from 'meteor/meteor'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { onServerExec } from '../../../api/utils/archUtils'
import { Item } from '../definitions/items/Item'
import { Lesson , Lesson , Lesson , Lesson } from '../../classroom/lessons/Lesson'

const itemTypes = Item && Object.values(Item.types).map(itemType => itemType.name)

export const TaskResults = {
  name: 'taskResult',
  label: 'unit.taskResult',
  icon: 'check',
  isClassroom: true,
  errors: {
    notEditable: 'taskResult.notEditable'
  },
  schema: {
    lessonId: String,
    taskId: String,
    itemId: String,
    groupId: {
      type: String,
      optional: true
    },
    groupMode: {
      type: String,
      optional: true
    },
    type: {
      type: String,
      optional: true,
      allowedValues: () => itemTypes
    },
    response: {
      type: Array,
      optional: true
    },
    'response.$': {
      type: String
    }
  },
  publicFields: {
    createdBy: 1,
    lessonId: 1,
    itemId: 1,
    taskId: 1
  },
  dependencies: [],
  helpers: {
    itemTypes () {
      return itemTypes
    }
  }
}

TaskResults.methods = {}

TaskResults.methods.saveTask = {
  name: 'taskResult.methods.saveTask',
  schema: {
    lessonId: TaskResults.schema.lessonId,
    taskId: TaskResults.schema.taskId,
    itemId: TaskResults.schema.itemId,
    groupId: TaskResults.schema.groupId,
    groupMode: TaskResults.schema.groupMode,
    response: TaskResults.schema.response,
    'response.$': TaskResults.schema['response.$']
  },
  run: onServerExec(function () {
        import { LessonErrors } from '../../classroom/lessons/LessonErrors'
    import { SchoolClass } from '../../classroom/schoolclass/SchoolClass'
    import { LessonStates } from '../../classroom/lessons/LessonStates'
    import { createGetDoc } from '../../../api/utils/documentUtils'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { Task } from '../../curriculum/curriculum/task/Task'
    import { Group } from '../../classroom/group/Group'

    const getLessonDoc = createDocGetter(Lesson)
    const checkTask = createDocGetter(Task)
    const getGroupDoc = createDocGetter(Group)

    /**
     * Saves a response to an item of a given task
     * @param lessonId the lesson of the task
     * @param taskId the task
     * @param itemId the item the response is related to
     * @param response the response value(s)
     * @return {undefined|String|Number} returns the doc id if inserted (undefined if failed) or the update number 1 if
     *   updated (0 if failed)
     */

    function saveTask ({ lessonId, taskId, itemId, groupId, groupMode, response }) {
      const { userId } = this
      if (!Lesson.helpers.isMemberOfLesson({ userId, lessonId })) {
        throw new Meteor.Error('errors.permissionDenied', SchoolClass.errors.notMember)
      }

      checkTask(taskId)
      const lessonDoc = getLessonDoc(lessonId)
      if (!LessonStates.isRunning(lessonDoc)) {
        throw new Meteor.Error('errors.permissionDenied', LessonErrors.unexpectedState)
      }

      // if groupId check group membership
      let groupDoc

      if (groupId) {
        groupDoc = getGroupDoc(groupId)

        if (!groupDoc.users.some(entry => entry.userId === userId)) {
          throw new Meteor.Error('errors.permissionDenied', 'group.notAMember', { groupId, userId })
        }
      }

      // check if we can even edit the task
      if (!Lesson.helpers.taskIsEditable({ lessonDoc, taskId, groupDoc })) {
        throw new Meteor.Error('errors.permissionDenied', TaskResults.errors.notEditable)
      }


      const createdBy = userId
      const TaskResultCollection = getCollection(TaskResults.name)
      const query = { lessonId, taskId, itemId, createdBy }
      if (groupId) {
        query.groupId = groupId
      }

      const taskResultDoc = TaskResultCollection.findOne(query)

      if (!taskResultDoc) {
        const insertDoc = { lessonId, taskId, itemId, response }
        if (groupId) {
          insertDoc.groupId = groupId
        }
        return TaskResultCollection.insert(insertDoc)
      }

      else {
        return TaskResultCollection.update(taskResultDoc._id, { $set: { response } })
      }
    }

    return saveTask
  })
}

TaskResults.publications = {}


/**
 * Reveal all results for a specific item, usable for instance in presentation mode
 */

TaskResults.publications.allByItem = {
  name: 'taskResult.publications.allbyItem',
  schema: {
    references: Array,
    'references.$': Object,
    'references.$.lessonId': String,
    'references.$.taskId': String,
    'references.$.itemId': String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
        import { SchoolClass } from '../../classroom/schoolclass/SchoolClass'
    import { userIsAdmin } from '../../../api/accounts/admin/userIsAdmin'
    import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'

    return function run ({ references }) {
      const userId = this.userId
      const query = { $or: [] }

      references.forEach(({ lessonId, taskId, itemId }) => {
        if (!userIsAdmin(userId) && !Lesson.helpers.isTeacher({ userId, lessonId })) {
          throw new PermissionDeniedError(SchoolClass.errors.notMember)
        }

        query.$or.push({ lessonId, taskId, itemId })
      })

      return getCollection(TaskResults.name).find(query)
    }
  })
}
/**
 * Subscribe to all my responses to an item that are associated with
 * my working group by groupId.
 */
TaskResults.publications.byGroup = {
  name: 'taskResult.publications.byGroup',
  schema: {
    groupId: String,
    itemId: String
  },
  run: onServerExec(function () {
    import { Group } from '../../classroom/group/Group'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
    const getGroupDoc = createDocGetter(Group)

    return function ({ groupId, itemId }) {
      const { userId } = this

      // check if user is group member
      const groupDoc = getGroupDoc(groupId)
      const { users } = groupDoc

      if (!users || !users.length || !users.find(u => u && u.userId === userId)) {
        throw new PermissionDeniedError('group.notAMember', { userId, groupId })
      }

      const query = { groupId, itemId }
      return getCollection(TaskResults.name).find(query)
    }
  })
}

TaskResults.publications.byTask = {
  name: 'taskResult.publications.byTask',
  schema: {
    lessonId: String,
    taskId: {
      type: String,
      optional: true
    }
  },
  run: onServerExec(function () {
        import { SchoolClass } from '../../classroom/schoolclass/SchoolClass'
    import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getLessonDoc = createDocGetter(Lesson)

    return function run ({ lessonId, taskId }) {
      const { userId } = this
      const lessonDoc = getLessonDoc({ _id: lessonId })
      const isTeacher = lessonDoc.createdBy === userId

      if (!isTeacher && !Lesson.helpers.isMemberOfLesson({ userId, lessonId })) {
        throw new PermissionDeniedError(SchoolClass.errors.notMember)
      }

      const query = { lessonId }
      if (!isTeacher) {
        query.createdBy = userId
      }
      if (taskId) {
        query.taskId = taskId
      }

      return getCollection(TaskResults.name).find(query)
    }
  })
}

import { Meteor } from 'meteor/meteor'
import { UserUtils } from '../../system/accounts/users/UserUtils'
import { onServerExec } from '../../../api/utils/archUtils'

export const TaskWorkingState = {
  name: 'taskWorkingState',
  label: 'taskWorkingState.title',
  icon: 'dots',
  isClassroom: true,
}

TaskWorkingState.errors = {
  taskNotEditable: 'taskWorkingState.taskNotEditable'
}

TaskWorkingState.schema = {
  lessonId: String,
  taskId: String,
  groupId: {
    type: String,
    optional: true
  },
  complete: {
    type: Boolean,
    optional: true
  },
  page: {
    type: Number,
    optional: true
  },
  progress: {
    type: Number,
    optional: true
  }
}

TaskWorkingState.publicFields = {
  createdBy: 1,
  lessonId: 1,
  taskId: 1,
  progress: 1
}

TaskWorkingState.dependencies = []

TaskWorkingState.methods = {}

TaskWorkingState.methods.saveState = {
  name: 'taskWorkingState.methods.saveState',
  schema: TaskWorkingState.schema,
  run: onServerExec(function () {
    import { Task } from '../../curriculum/curriculum/task/Task'
    import { LessonStates } from '../../classroom/lessons/LessonStates'
    import { Lesson } from '../../classroom/lessons/Lesson'
    import { Group } from '../../classroom/group/Group'
    import { Features } from '../../../api/config/Features'
    import {LessonErrors } from '../../classroom/lessons/LessonErrors'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { ensureDocumentExists } from '../../../api/utils/document/ensureDocumentExists'
    import { getCollection } from '../../../api/utils/getCollection'

    const checkTaskDoc = createDocGetter({ name: Task.name, optional: false })
    const getGroupDoc = createDocGetter({ name: Group.name, optional: false })

    /**
     * Saves a current task working state.
     * @param lessonId
     * @param taskId
     * @param complete
     * @param page
     * @param progress
     * @return {*}
     */
    return function saveState ({ lessonId, taskId, groupId, complete, page, progress }) {
      const { userId } = this
      const { lessonDoc } = Lesson.helpers.docsForStudent({ userId, lessonId })

      ensureDocumentExists({
        document: lessonDoc,
        docId: lessonId,
        userId: userId
      })

      if (!LessonStates.isRunning(lessonDoc)) {
        throw new Meteor.Error(LessonErrors.unexpectedState, LessonErrors.expectedRunning)
      }

      // look for task doc and throw if no doc found by id
      checkTaskDoc(taskId)

      // if we have a group we need to get the groupDoc, too
      const groupDoc = groupId && getGroupDoc(groupId)

      if (groupId) {
        Features.ensure('groups')
        ensureDocumentExists({
          document: groupDoc,
          docId: groupId,
          userId: userId
        })
      }

      const groupVisible = groupDoc && groupDoc.visible
      const allMaterial = (groupVisible || []).concat(lessonDoc.visibleStudent || [])
      const taskIsVisible = allMaterial.find(entry => entry._id === taskId)

      // also check if this task is even editable = visible to students
      if (!taskIsVisible) {
        throw new Meteor.Error(TaskWorkingState.errors.taskNotEditable, 'taskWorkingState.notVisible', { taskId })
      }

      const TaskWorkingStateCollection = getCollection(TaskWorkingState.name)
      const taskWorkingStateQuery = { createdBy: userId, lessonId, taskId }

      if (groupId) {
        taskWorkingStateQuery.groupId = groupId
      }

      const taskWorkingStateDoc = TaskWorkingStateCollection.findOne(taskWorkingStateQuery)

      // create a new task working state if none exists yet
      if (!taskWorkingStateDoc) {
        const newTaskWorkingStateDoc = { lessonId, taskId, complete, page, progress }

        if (groupId) {
          newTaskWorkingStateDoc.groupId = groupId
        }

        return TaskWorkingStateCollection.insert(newTaskWorkingStateDoc)
      }

      // or update the existing one
      else {
        // TODO add a safety check to prevent updating tas kworking state document from other users
        const updated = TaskWorkingStateCollection.update(taskWorkingStateDoc._id, {
          $set: { complete, page, progress }
        })

        if (!updated) {
          throw new Meteor.Error('errors.updateFailed', taskWorkingStateDoc._id)
        }

        return updated
      }
    }
  })
}

TaskWorkingState.publications = {}

/**
 * Get all working states for tasks of my lesson. Teacher only
 */
TaskWorkingState.publications.byLesson = {
  name: 'taskWorkingState.publications.byLesson',
  schema: {
    lessonId: String
  },
  run: onServerExec(function () {
    import { Lesson } from '../../classroom/lessons/Lesson'
    import { getCollection } from '../../../api/utils/getCollection'

    return function run ({ lessonId }) {
      const { userId } = this
      if (!Lesson.helpers.isMemberOfLesson({ userId, lessonId })) {
        throw new Meteor.Error('errors.noClassMember')
      }
      return getCollection(TaskWorkingState.name).find({ lessonId })
    }
  }),
  roles: [UserUtils.roles.teacher]
}

TaskWorkingState.publications.myTask = {
  name: 'taskWorkingState.publications.myTask',
  schema: {
    lessonId: String,
    taskId: {
      type: String,
      optional: true
    },
    groupId: {
      type: String,
      optional: true
    }
  },
  run: onServerExec(function () {
    import { Features } from '../../../api/config/Features'
    import { getCollection } from '../../../api/utils/getCollection'

    return function transform ({ lessonId, taskId, groupId }) {
      const createdBy = this.userId
      const query = { lessonId, createdBy }

      if (taskId) {
        query.taskId = taskId
      }

      if (groupId) {
        Features.ensure('groups')
        query.groupId = groupId
      }

      return getCollection(TaskWorkingState.name).find(query)
    }
  })
}

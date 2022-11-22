import { Meteor } from 'meteor/meteor'
import { TaskWorkingState } from '../TaskWorkingState'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { LessonStates } from '../../../classroom/lessons/LessonStates'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { Group } from '../../../classroom/group/Group'
import { Features } from '../../../../api/config/Features'
import { LessonErrors } from '../../../classroom/lessons/LessonErrors'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { ensureDocumentExists } from '../../../../api/utils/document/ensureDocumentExists'
import { getCollection } from '../../../../api/utils/getCollection'

const checkTaskDoc = createDocGetter({ name: Task.name, optional: false })
const getGroupDoc = createDocGetter({ name: Group.name, optional: false })

/**
 * Saves a current task working state.
 * @param lessonId
 * @param taskId
 * @param groupId
 * @param complete
 * @param page
 * @param progress
 * @return {*}
 */
export const saveTaskWorkingState = function ({ lessonId, taskId, groupId, complete, page, progress }) {
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

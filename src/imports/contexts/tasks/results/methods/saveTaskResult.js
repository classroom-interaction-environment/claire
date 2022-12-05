import { Meteor } from 'meteor/meteor'
import { LessonErrors } from '../../../classroom/lessons/LessonErrors'
import { SchoolClass } from '../../../classroom/schoolclass/SchoolClass'
import { LessonStates } from '../../../classroom/lessons/LessonStates'
import { Lesson } from '../../../classroom/lessons/Lesson'
import { createDocGetter } from '../../../../api/utils/document/createDocGetter'
import { Task } from '../../../curriculum/curriculum/task/Task'
import { Group } from '../../../classroom/group/Group'
import { getCollection } from '../../../../api/utils/getCollection'
import { TaskResults } from '../TaskResults'
import { LessonHelpers } from '../../../classroom/lessons/LessonHelpers'

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

export const saveTaskResult = function ({ lessonId, taskId, itemId, groupId, groupMode, response }) {
  const { userId } = this
  if (!LessonHelpers.isMemberOfLesson({ userId, lessonId })) {
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
  if (!LessonHelpers.taskIsEditable({ lessonDoc, taskId, groupDoc })) {
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

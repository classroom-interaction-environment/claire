import { UserUtils } from '../../system/accounts/users/UserUtils'
import { onServerExec } from '../../../api/utils/archUtils'

export const TaskWorkingState = {
  name: 'taskWorkingState',
  label: 'taskWorkingState.title',
  icon: 'dots',
  isClassroom: true
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
  run: onServerExec(() => {
    import { saveTaskWorkingState } from './methods/saveTaskWorkingState'

    return saveTaskWorkingState
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
  run: onServerExec(() => {
    import { taskWorkingStateByLesson } from './methods/byLesson'
    return taskWorkingStateByLesson
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
  run: onServerExec(() => {
    import { getMyTaskWorkingState } from './methods/getMyTaskWorkingState'
    return getMyTaskWorkingState
  })
}

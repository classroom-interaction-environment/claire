import { UserUtils } from '../../system/accounts/users/UserUtils'
import { onServerExec } from '../../../api/utils/archUtils'
import { Item } from '../definitions/items/Item'

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
  run: onServerExec(() => {
    import { saveTaskResult } from './methods/saveTaskResult'
    return saveTaskResult
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
    import { getAllTasksByItem } from './methods/getAllTasksByItem'
    return getAllTasksByItem
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
    import { getAllTasksByGroupAndItem } from './methods/getAllTaskByGroup'
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
    import { getAllTaskResultsByTask } from './methods/getAllTaskResultsByTask'
    return getAllTaskResultsByTask
  })
}

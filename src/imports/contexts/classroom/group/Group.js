import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { UserUtils } from '../../system/accounts/users/UserUtils'

export const Group = {}

Group.name = 'group'
Group.label = 'group.title'
Group.icon = 'users'
Group.isClassroom = true
Group.publicFields = {
  title: 1,
  users: 1,
  maxUsers: 1,
  isAdhoc: 1,
  classId: 1,
  unitId: 1,
  phases: 1,
  material: 1,
  visible: 1
}

/**
 * The group doc schema
 * @type {object}
 */
Group.schema = {

  title: {
    type: String
  },

  /**
   * A group requires at least one user. We support single-user groups to ease
   * the case, that there is exact one user remaining and can't be added due
   * to clash with the maxUsers definitions.
   */

  users: {
    type: Array,
    label: 'group.users',
    min: 1
  },

  'users.$': {
    type: Object
  },

  'users.$.userId': String,
  'users.$.role': {
    type: String,
    optional: true
  },

  /**
   * Upper limit of users is optional
   */

  maxUsers: {
    type: Number,
    label: 'group.maxUsers',
    optional: true,
    min: 0,
    max: Number.MAX_SAFE_INTEGER
  },

  /**
   * determines, whether a group has been created
   * during a running lesson (ad-hoc).
   * In such case it's a temporary group that
   * is deleted, if the lesson is reset
   */
  isAdhoc: {
    type: Boolean,
    optional: true
  },

  /**
   * Associate a class
   */

  classId: {
    type: String,
    optional: true
  },

  /**
   * Limit scope to a certain unit, if desired
   */
  unitId: {
    type: String,
    optional: true
  },

  /**
   * Limit scope of group to just certain phases
   */

  phases: {
    type: Array,
    optional: true
  },
  'phases.$': {
    type: String
  },

  /**
   * Associate material with this group.
   */
  material: {
    type: Array,
    optional: true
  },

  'material.$': {
    type: String
  },

  visible: {
    type: Array,
    optional: true
  },

  'visible.$': {
    type: Object
  },

  'visible.$._id': {
    type: String
  },

  'visible.$.context': {
    type: String
  }
}

Group.publications = {}

Group.publications.my = {
  name: 'group.publications.my',
  schema: {
    classId: {
      type: String,
      optional: true
    },
    unitId: {
      type: String,
      optional: true
    }
  },
  run: onServer(function ({ classId, unitId } = {}) {
    const { userId } = this
    const query = { $or: [] }

    // option 1: I am creator of these
    const myGroups = { createdBy: userId }

    if (classId) myGroups.classId = classId
    if (unitId) myGroups.unitId = unitId

    // option 2: I am member of these groups
    const iamMember = { users: { $elemMatch: { userId } } }

    if (classId) iamMember.classId = classId
    if (unitId) iamMember.unitId = unitId

    query.$or.push(myGroups, iamMember)
    return getCollection(Group.name).find(query, { fields: Group.publicFields })
  })
}

/**
 * @role {student}
 */
Group.publications.single = {
  name: 'group.publications.single',
  schema: {
    groupId: {
      type: String
    }
  },
  role: [UserUtils.roles.student],
  run: onServer(function ({ groupId }) {
    const { userId } = this
    const query = { _id: groupId, users: { $elemMatch: { userId } } }
    return getCollection(Group.name).find(query, { fields: Group.publicFields })
  })
}

Group.methods = {}

/**
 * Returns all groups that a teacher owns by given ids
 * @param ids {[string]} a list of group ids
 * @returns {[object]} a list of documents for the given ids
 * @throws {PermissionDenied} if user has no permission for one of the groups
 */
Group.methods.get = {
  name: 'group.methods.get',
  schema: {
    ids: Array,
    'ids.$': String
  },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { $in } from '../../../api/utils/query/inSelector'

    return function ({ ids }) {
      const { userId } = this
      const query = { _id: $in(ids), createdBy: userId }
      return getCollection(Group.name).find(query).fetch()
    }
  })
}

/**
 * Saves a group document. Creates a new doc of it does not exist yet.
 *
 * @param _id {string=} only for updating a group doc required
 * @param title {string} the title of the group
 * @param users
 * @param maxUsers
 * @param classId
 * @param phases
 * @param material
 * @param visible
 */
Group.methods.save = {
  name: 'group.methods.save',
  schema: Object.assign({
    _id: {
      type: String,
      optional: true
    }
  }, Group.schema),
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { checkEditPermission } from '../../../api/document/checkEditPermissions'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getGroupDoc = createDocGetter({ name: Group.name })

    return function (groupDoc) {
      const { userId } = this
      const { _id, ...doc } = groupDoc

      if (_id) {
        const originalDoc = getGroupDoc({ _id })
        checkEditPermission({ doc: originalDoc, userId })
        return getCollection(Group.name).update(_id, { $set: doc })
      }

      return getCollection(Group.name).insert(doc)
    }
  })
}

Group.methods.update = {
  name: 'group.methods.update',
  schema: { _id: String, ...Group.schema },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { checkEditPermission } from '../../../api/document/checkEditPermissions'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getGroupDoc = createDocGetter({ name: Group.name })

    return function ({ _id, ...updateDoc }) {
      const doc = getGroupDoc({ _id })
      const { userId } = this
      checkEditPermission({ doc, userId })
      return getCollection(Group.name).update({ _id }, { $set: updateDoc })
    }
  })
}

Group.methods.delete = {
  name: 'group.methods.delete',
  schema: { _id: String },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { checkEditPermission } from '../../../api/document/checkEditPermissions'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getGroupDoc = createDocGetter({ name: Group.name })

    return function ({ _id }) {
      const doc = getGroupDoc({ _id })
      const { userId } = this
      checkEditPermission({ doc, userId })
      return getCollection(Group.name).remove(_id)
    }
  })
}

Group.methods.toggleMaterial = {
  name: 'group.methods.toggleMaterial',
  schema: { _id: String, materialId: String, contextName: String },
  roles: UserUtils.roles.teacher,
  run: onServerExec(function () {
    import { checkEditPermission } from '../../../api/document/checkEditPermissions'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'

    const getGroupDoc = createDocGetter({ name: Group.name })

    return function ({ _id, materialId, contextName }) {
      const groupDoc = getGroupDoc({ _id })
      const { userId } = this
      checkEditPermission({ doc: groupDoc, userId })

      const mutation = {}
      const visibleList = groupDoc.visible || []
      const hasMaterial = visibleList.some(v => v._id === materialId)

      if (hasMaterial) {
        mutation.$pull = { visible: { _id: materialId } }
      }

      else {
        const visible = { _id: materialId, context: contextName }
        mutation.$addToSet = { visible }
      }
      return getCollection(Group.name).update(_id, mutation)
    }
  })
}

Group.methods.users = {
  name: 'group.methods.users',
  schema: { groupId: String },
  role: UserUtils.roles.student,
  run: onServerExec(function () {
    import { Users } from '../../system/accounts/users/User'
    import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { $in } from '../../../api/utils/query/inSelector'
    import { getUsersCollection } from '../../../api/utils/getUsersCollection'

    const getGroupDoc = createDocGetter(Group)

    return function ({ groupId }) {
      const { userId } = this
      const groupDoc = getGroupDoc({ _id: groupId })
      const { users, createdBy } = groupDoc

      if (createdBy !== userId && !users.some(entry => entry.userId === userId)) {
        throw new PermissionDeniedError('group.notAMember', {
          groupId, userId
        })
      }

      const allUserIds = []
      users.forEach(entry => {
        if (entry.userId !== userId) {
          allUserIds.push(entry.userId)
        }
      })

      return getUsersCollection()
        .find({ _id: $in(allUserIds) }, { fields: Users.publicFields })
        .fetch()
    }
  })
}

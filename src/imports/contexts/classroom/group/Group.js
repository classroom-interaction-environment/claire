import { onServer, onServerExec } from '../../../api/utils/archUtils'
import { getCollection } from '../../../api/utils/getCollection'
import { checkEditPermission } from '../../../api/document/checkEditPermissions'
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
  lessonId: 1,
  phases: 1,
  material: 1,
  visible: 1
}

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
   * Associate a class
   */

  classId: {
    type: String,
    optional: true
  },

  /**
   * Limit scope to a certain lesson, if desired.
   */

  lessonId: {
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
    lessonId: {
      type: String,
      optional: true
    },
    classId: {
      type: String,
      optional: true
    }
  },
  run: onServer(function ({ lessonId, classId }) {
    const { userId } = this
    const query = { $or: [] }

    // option 1: I am creator of these
    const myGroups = { createdBy: userId }

    if (lessonId) myGroups.lessonId = lessonId
    if (classId) myGroups.classId = classId

    // option 2: I am member of these groups
    const iamMember = { users: { $elemMatch: { userId } } }

    if (lessonId) iamMember.lessonId = lessonId
    if (classId) iamMember.classId = classId

    query.$or.push(myGroups, iamMember)

    const cursor = getCollection(Group.name).find(query, { fields: Group.publicFields })
    console.log(this.userId, JSON.stringify(query), cursor.count())
    return cursor
  })
}

Group.publications.single = {
  name: 'group.publications.single',
  schema: {
    groupId: {
      type: String,
    }
  },
  run: onServer(function ({ groupId }) {
    const { userId } = this
    const query = { _id: groupId, users: { $elemMatch: { userId } } }
    const cursor = getCollection(Group.name).find(query, { fields: Group.publicFields })
    console.log(this.userId, JSON.stringify(query), cursor.count())
    return cursor
  })
}

Group.methods = {}

Group.methods.save = {
  name: 'group.methods.save',
  schema: Object.assign({
    _id: {
      type: String,
      optional: true
    }
  }, Group.schema),
  run: onServerExec(function () {
    return function (groupDoc) {
      const { userId } = this
      const { _id, ...doc } = groupDoc

      if (_id) {
        checkEditPermission({ doc: groupDoc, userId })
        return getCollection(Group.name).update(_id, { $set: doc })
      }

      return getCollection(Group.name).insert(doc)
    }
  })
}

Group.methods.delete = {
  name: 'group.methods.delete',
  schema: { _id: String },
  run: onServer(function ({ _id }) {
    return getCollection(Group.name).remove(_id)
  })
}

Group.methods.toggleMaterial = {
  name: 'group.methods.toggleMaterial',
  schema: { _id: String, materialId: String, contextName: String },
  run: onServerExec(function () {
    return function ({ _id, materialId, contextName }) {
      const GroupCollection = getCollection(Group.name)
      const groupDoc = GroupCollection.findOne(_id)

      // TODO use ensureDocument
      if (!groupDoc) throw new Error('docNotFound')

      // TODO ensureDocument
      const materialExists = (groupDoc.material || []).includes(materialId)
      if (!materialExists) throw new Error('noMaterial')

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
      this.log({ _id, mutation })
      return GroupCollection.update(_id, mutation)
    }
  })
}

Group.methods.users = {
  name: 'group.methods.users',
  schema: { groupId: String },
  role: UserUtils.roles.student,
  run: onServerExec(function (){
    import { Users } from '../../system/accounts/users/User'
    import { PermissionDeniedError } from '../../../api/errors/types/PermissionDeniedError'
    import { createDocGetter } from '../../../api/utils/document/createDocGetter'
    import { $in } from '../../../api/utils/query/inSelector'

    const getGroupDoc = createDocGetter(Group)

    return function ({ groupId }) {
      const { userId } = this
      const groupDoc = getGroupDoc({ _id: groupId })

      if (!groupDoc.users || !groupDoc.users.some(entry => entry.userId === userId)) {
        throw new PermissionDeniedError('group.notAMember', {
          groupId, userId
        })
      }

      const allUserIds = []
      groupDoc.users.forEach(entry => {
        if (entry.userId !== userId) {
          allUserIds.push(entry.userId)
        }
      })

      return Meteor.users.find({ _id: $in(allUserIds) }, { fields: Users.publicFields }).fetch()
    }
  })
}

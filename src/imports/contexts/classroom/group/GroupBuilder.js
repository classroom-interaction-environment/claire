import { Meteor } from 'meteor/meteor'
import { check, Match } from 'meteor/check'
import { ReactiveVar } from 'meteor/reactive-var'

const internal = {
  defaultGroupTitle: 'group.defaultTitle'
}

/**
 * @class
 * @member {ReactiveVar} groups
 * @member {[string]} users
 * @member {[string]} phases
 * @member {[string]} material
 * @member {number} maxGroups
 * @member {number} maxUsers
 * @member {boolean} materialForAllGroups
 * @member {boolean} materialAutoShuffle
 * @member {[string]} roles
 * @member {string} groupTitleDefault
 */
class GroupBuilder {
  static defaultGroupTitle (value) {
    internal.defaultGroupTitle = value
  }

  constructor ({ groupTitleDefault = internal.defaultGroupTitle } = {}) {
    this.groups = new ReactiveVar([])
    this.users = []
    this.phases = []
    this.material = []
    this.maxGroups = 0
    this.maxUsers = 0 // per group
    this.materialForAllGroups = false
    this.materialAutoShuffle = false
    this.roles = []
    this.groupTitleDefault = groupTitleDefault
  }

  /**
   * @param options {object}
   * @param options.users {[string]=}
   * @param options.phases {[string]=}
   * @param options.material {[string]=}
   * @param options.roles {[string]=}
   * @param options.maxGroups {number=}
   * @param options.maxUsers {number=}
   * @param options.materialForAllGroups {boolean=}
   * @param options.materialAutoShuffle {boolean=}
   * @return {GroupBuilder}
   */
  setOptions (options) {
    check(options, {
      users: Match.Maybe([String]),
      phases: Match.Maybe([String]),
      material: Match.Maybe([String]),
      roles: Match.Maybe([String]),
      maxGroups: Match.Maybe(Number),
      maxUsers: Match.Maybe(Number),
      materialForAllGroups: Match.Maybe(Boolean),
      materialAutoShuffle: Match.Maybe(Boolean)
    })

    this.maxGroups = options.maxGroups || this.maxGroups
    this.maxUsers = options.maxUsers || this.maxUsers
    this.materialForAllGroups = options.materialForAllGroups || this.materialForAllGroups
    this.materialAutoShuffle = options.materialAutoShuffle || this.materialAutoShuffle

    if (options.users) {
      // sanity check
      const maxSize = this.maxGroups * this.maxUsers
      if (maxSize > 0 && options.users.length > maxSize) {
        throw new Meteor.Error('groupBuilder.error', 'groupBuilder.maxUsersExceeded')
      }

      this.oddDistribution = options.users.length % this.maxUsers !== 0
      this.users = options.users
    }

    if (options.phases) {
      this.phases = options.phases
    }

    if (options.roles) {
      this.roles = options.roles
    }

    if (options.material) {
      this.material = options.material
    }

    return this
  }

  createGroups ({ shuffle = false }) {
    checkUsers(this.users, this.maxUsers * this.maxGroups)

    if (this.users.length === 0) {
      throw new Error('groupBuilder.error', 'groupBuilder.atLeastOneUserRequired')
    }

    const material = this.material || []
    const materialCount = material.length

    // no matter if we shuffle or not, we create a default set of groups
    // that hypothetically allows to distribute all users
    const groupLength = Math.ceil(this.users.length / (this.maxUsers || 1))
    for (let i = 0; i < groupLength; i++) {
      const group = {}
      group.title = `${this.groupTitleDefault} ${i + 1}`

      if (this.materialAutoShuffle) {
        // if we have more groups than material or equal
        // we simply rotate each material around the groups
        if (groupLength >= materialCount) {
          group.material = [material[i % materialCount]]
        }

        // if we have more material files than groups
        // we need to find the right split for material
        // and distribute multiple material per group
        else {
          const materialRatio = Math.round(materialCount / groupLength)
          const offset = i * materialRatio
          const groupMaterial = material.slice(offset, offset + materialRatio)
          group.material = groupMaterial.filter(entry => !!entry)
        }
      }

      this.addGroup(group)
    }

    if (shuffle) {
      const shuffled = shuffleArray(this.users)
      const groups = this.groups.get()
      const roles = this.roles || []
      const rolesCount = roles.length

      groups.forEach((group) => {
        group.users = shuffled
          .splice(0, this.maxUsers)
          .filter(id => !!id)
          .map((userId, userIndex) => {
            const obj = { userId }
            if (rolesCount > 0) {
              obj.role = roles[userIndex % rolesCount]
            }
            return obj
          })
      })

      this.groups.set(groups)
    }

    return this
  }

  // ---------------------------------------------------------------------------
  // GROUPS
  // ---------------------------------------------------------------------------

  /**
   * Adds a new group to the internal group stack
   * @param options {object}
   * @param options.users {[object]}
   * @param options.title {string}
   * @param options.material {[string]}
   * @return {GroupBuilder}
   */
  addGroup (options) {
    checkGroupOptions(options)
    checkUsers(options.users, this.maxUsers * this.maxGroups)
    const { title, users = [] } = options
    const groups = this.groups.get()
    const phases = [].concat(this.phases)
    const material = this.materialForAllGroups
      ? [].concat(this.material)
      : options.material

    groups.push({ title, users, phases, material })
    this.groups.set(groups)
    return this
  }

  removeGroup (index) {
    const groups = this.groups.get()
    if (index < 0 || index > groups.length - 1) {
      throw new Error('groupBuilder.error', 'groupBuilder.invalidIndex', { index })
    }
    groups.splice(index, 1)
    this.groups.set(groups)

    return this
  }

  updateGroup ({ index, title }) {
    const groups = this.groups.get()
    if (index < 0 || index > groups.length - 1) {
      throw new Error('groupBuilder.error', 'groupBuilder.invalidIndex', { index })
    }
    groups[index].title = title
    this.groups.set(groups)

    return this
  }

  getAllGroups () {
    return this.groups.get()
  }

  getGroup (index) {
    return this.groups.get()[index]
  }

  resetGroups () {
    this.groups.set([])
    return this
  }

  hasMaxGroups () {
    return (this.groups.get() ?? []).length >= this.maxGroups
  }

  // ---------------------------------------------------------------------------
  // MATERIAL
  // ---------------------------------------------------------------------------
  addMaterial ({ index, materialId }) {
    const groups = this.groups.get() || []
    checkGroupIndex(index, groups)
    check(materialId, String)

    const group = groups[index]
    group.material = group.material || []

    if (group.material.includes(materialId)) {
      throw new Error('groupBuilder.error', 'groupBuilder.expectedNoMaterial')
    }

    group.material.push(materialId)
    groups[index] = group

    this.groups.set(groups)
    return this
  }

  removeMaterial ({ index, materialId }) {
    const groups = this.groups.get() || []
    checkGroupIndex(index, groups)
    check(materialId, String)

    const group = groups[index]
    group.material = group.material || []

    const materialIndex = group.material.indexOf(materialId)
    if (materialIndex === -1) {
      throw new Error('groupBuilder.error', 'groupBuilder.expectedMaterial')
    }

    group.material.splice(materialIndex, 1)
    groups[index] = group

    this.groups.set(groups)
    return this
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  addUser ({ index, userId, role }) {
    const groups = this.groups.get() || []
    checkGroupIndex(index, groups)
    check(userId, String)
    check(role, Match.Maybe(String))

    groups[index].users = groups[index].users || []

    const userIndex = groups[index].users.findIndex(doc => doc.userId === userId)
    if (userIndex > -1) {
      throw new Meteor.Error('groupBuilder.error', 'groupBuilder.expectedNoUser')
    }

    groups[index].users.push({ userId, role })
    this.groups.set(groups)

    return this
  }

  updateUser ({ index, userId, role }) {
    const groups = this.groups.get() || []
    checkGroupIndex(index, groups)
    check(userId, String)
    check(role, Match.Maybe(String))

    groups[index].users = groups[index].users || []

    const userIndex = groups[index].users.findIndex(doc => doc.userId === userId)
    if (userIndex === -1) {
      throw new Meteor.Error('groupBuilder.error', 'groupBuilder.expectedUser')
    }

    groups[index].users[userIndex] = { userId, role }
    this.groups.set(groups)

    return this
  }

  removeUser ({ index, userId, role }) {
    const groups = this.groups.get() || []
    checkGroupIndex(index, groups)
    check(userId, String)
    check(role, Match.Maybe(String))

    groups[index].users = groups[index].users || []

    const userIndex = groups[index].users.findIndex(doc => doc.userId === userId)
    if (userIndex === -1) {
      throw new Meteor.Error('groupBuilder.error', 'groupBuilder.expectedUser')
    }

    groups[index].users.splice(userIndex, 1)
    this.groups.set(groups)

    return this
  }

  userHasBeenAssigned (userId) {
    if (!this.users.includes(userId)) {
      throw new Meteor.Error('groupBuilder.error', 'groupBuilder.invalidUserId')
    }
    const groups = this.groups.get()
    return userHasBeenAssigned(groups, userId)
  }
}

// /////////////////////////////////////////////////////////////////////////////
//
// INTERNAL
//
// /////////////////////////////////////////////////////////////////////////////

const checkGroupOptions = options => check(options, Match.ObjectIncluding({
  title: String,
  users: Match.Maybe([{
    role: Match.Maybe(String),
    userId: Match.Maybe(String)
  }]),
  phases: Match.Maybe([String]),
  material: Match.Maybe([String])
}))

const checkGroupIndex = (index, groups) => {
  if (index < 0 || index > groups.length - 1 || !groups[index]) {
    throw new Meteor.Error('groupBuilder.error', 'groupBuilder.invalidIndex')
  }
}

const checkUsers = (users = [], maxUsers) => {
  if (maxUsers && users.length > maxUsers) {
    throw new Meteor.Error('groupBuilder.error', 'groupBuilder.maxUsersExceeded')
  }
}

const shuffleArray = input => {
  const array = [].concat(input)
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

const userHasBeenAssigned = (groups, userId) => {
  return groups.some(group => {
    if (!group.users?.length) return false

    return group.users.some(doc => doc.userId === userId)
  })
}
// /////////////////////////////////////////////////////////////////////////////
//
// EXPORT
//
// /////////////////////////////////////////////////////////////////////////////

export { GroupBuilder }

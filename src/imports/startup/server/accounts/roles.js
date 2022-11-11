import { Meteor } from 'meteor/meteor'
import { Roles } from 'meteor/alanning:roles'
import { UserUtils } from '../../../contexts/system/accounts/users/UserUtils'
import { createLog } from '../../../api/log/createLog'
import { $nin } from '../../../api/utils/query/notInSelector'

const { admin, student, schoolAdmin, teacher, curriculum } = UserUtils.roles
const log = createLog({ name: 'Roles' })

log('setup roles')
const allRoles = [admin, schoolAdmin, teacher, student, curriculum]

allRoles.forEach(role => {
  log(`create role [${role}] if not exists`)
  Roles.createRole(role, { unlessExists: true })
})

// build internal hierarchy
// to allow inheritance of roles
log('create hierarchy')
Roles.addRolesToParent(schoolAdmin, admin, { unlessExists: true })
Roles.addRolesToParent(curriculum, schoolAdmin, { unlessExists: true })
Roles.addRolesToParent(teacher, curriculum, { unlessExists: true })
Roles.addRolesToParent(student, teacher, { unlessExists: true })

log('remove unused / deprecated roles')
const removedRoles = Meteor.roles.remove({ _id: $nin(allRoles) })

if (removedRoles) {
  log('removed', removedRoles, 'roles')
}

log('publish own roles')
Meteor.publish(null, function () {
  const { userId } = this
  if (userId) {
    return Meteor.roleAssignment.find({ 'user._id': userId })
  }
  this.ready()
})

log('setup complete')

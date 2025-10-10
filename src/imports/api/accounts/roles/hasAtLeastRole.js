import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { mapFromObject } from '../../utils/mapFromObject'
import { getHighestRole } from './getHighestRole'

export const hasAtLeastRole = async (userId = Meteor.userId(), role, scope) => {
  check(userId, String)
  check(role, String)
  const highest = await getHighestRole(userId, scope)
  return roleIndices.get(highest) <= roleIndices.get(role)
}

const roleIndices = mapFromObject({
  admin: 0,
  schoolAdmin: 1,
  curriculum: 2,
  teacher: 3,
  student: 4
})
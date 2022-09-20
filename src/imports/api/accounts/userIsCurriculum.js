import { UserUtils } from '../../contexts/system/accounts/users/UserUtils'

export const userIsCurriculum = (userId = Meteor.userId()) => {
  return UserUtils.isCurriculum(userId) // TODO decouple from UserUtils
}

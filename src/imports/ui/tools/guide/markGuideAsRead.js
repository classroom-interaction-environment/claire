import { Users } from '../../../contexts/system/accounts/users/User'
import { callMethod } from '../../controllers/document/callMethod'

export const markGuideAsRead = (...guides) => {
  return callMethod({
    name: Users.methods.guideViewed,
    args: { guides }
  })
}
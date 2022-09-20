import { createResearchConfirmToken } from './createResearchConfirmToken'
import { createResearchConfirmUrl } from './createResearchConfirmUrl'
import { sendResearchConfirmationEmail } from './sendResearchConfirmationEmail'

export const setResearch = function setResearch ({ participate }) {
  const { userId } = this

  Meteor.users.update(userId, {
    $set: {
      'research.participate': participate
    },
    $unset: {
      'research.confirmed': 1,
      'research.token': 1,
      'research.confirmedAt': 1
    }
  })

  if (participate) {
    const user = Meteor.users.findOne(userId)
    console.debug(user)
    const { firstName, lastName } = user
    const token = createResearchConfirmToken({ userId })
    const email = user.emails[0].address

    return sendResearchConfirmationEmail({
      to: email,
      url: createResearchConfirmUrl({ email, token }),
      fullName: `${firstName} ${lastName}`
    })
  }
}

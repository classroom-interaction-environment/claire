import { Meteor } from 'meteor/meteor'
import { createResearchConfirmToken } from './createResearchConfirmToken'
import { createResearchConfirmUrl } from './createResearchConfirmUrl'
import { sendResearchConfirmationEmail } from './sendResearchConfirmationEmail'

export const setResearch = async ({ userId, participate }) => {
  await Meteor.users.updateAsync(userId, {
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
    const user = await Meteor.users.findOneAsync(userId)
    const { firstName, lastName } = user
    const token = await createResearchConfirmToken({ userId })
    const email = user.emails[0].address

    return sendResearchConfirmationEmail({
      to: email,
      url: createResearchConfirmUrl({ email, token }),
      fullName: `${firstName} ${lastName}`
    })
  }
}

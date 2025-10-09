import { Meteor } from 'meteor/meteor'
import { Random } from 'meteor/random'

export const createResearchConfirmToken = async ({ userId }) => {
  const token = Random.secret()
  await Meteor.users.updateAsync(userId, { $set: { 'research.token': token } })
  return token
}

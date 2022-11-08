import { Random } from 'meteor/random'

export const createResearchConfirmToken = ({ userId }) => {
  const token = Random.secret()
  Meteor.users.update(userId, { $set: { 'research.token': token } })
  return token
}

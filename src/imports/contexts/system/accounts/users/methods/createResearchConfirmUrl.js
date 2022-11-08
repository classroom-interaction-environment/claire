export const createResearchConfirmUrl = ({ email, token }) => {
  const queryString = encodeURIComponent(`email=${email}&token=${token}`)
  const base64Query = Buffer.from(queryString).toString('base64')
  return Meteor.absoluteUrl(`/confirm-research/${base64Query}`)
}

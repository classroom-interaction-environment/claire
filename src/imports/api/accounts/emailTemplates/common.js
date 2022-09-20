export const getFullName = user => {
  const firstName = user.firstName
  const lastName = user.lastName
  return `${firstName} ${lastName}`
}

export const getCredentialsAsBuffer = (user, encoding = 'base64') => {
  const email = user.emails[0].address
  const firstName = user.firstName
  const lastName = user.lastName
  const credentialsJson = JSON.stringify([email, firstName, lastName])
  return Buffer.from(credentialsJson).toString(encoding)
}

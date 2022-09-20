export const tokenizeEmail = email => {
  const emailSplit = email.split('@')
  const domainSplit = emailSplit[1].split('.')
  return {
    prefix: emailSplit[0],
    domain: domainSplit[0],
    ending: domainSplit[1]
  }
}

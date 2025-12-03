/**
 * Check if user has at least one verified email
 * @param user {object}
 * @return {boolean}
 */
export const userIsVerified = (user = {}) => {
  if (!user) {
    return false
  }

  const { emails } = user
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    return false
  }
  return emails.some(isVerified)
}

/**
 * @private
 * @param email
 * @return {boolean}
 */
const isVerified = email => email.verified === true
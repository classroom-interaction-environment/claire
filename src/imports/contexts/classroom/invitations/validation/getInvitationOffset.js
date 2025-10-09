/**
 * Calculates a future date as unix timestamp
 * @param date A date instance
 * @param days the number of days to add
 * @return {number} the unix timestamp as integer
 */
export const getInvitationOffset = (date, days) => {
  const offset = days * 86400000 // days in ms
  return date.getTime() + offset
}

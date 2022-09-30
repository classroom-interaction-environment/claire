/**
 * Checks whether a date is of today or of yesterday. Returns undefined if neither.
 * @param date {Date}
 * @returns {string|undefined} one of 'today', 'yesterday' or undefined
 */
export const isTodayOrYesterday = date => {
  const today = new Date()
  if (
    date.getFullYear() !== today.getFullYear() ||
    date.getMonth() !== today.getMonth()) {
    return
  }

  const day = date.getDate()
  const thisDay = today.getDate()
  if (day === thisDay) {
    return 'today'
  }
  if (day === thisDay - 1) {
    return 'yesterday'
  }
}

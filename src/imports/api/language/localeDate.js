import { currentLanguage } from './currentLanguage'

/**
 * Transforms a Date to localeDateString with the current
 * locale date options as parameter for formatting.
 *
 * TODO: let users set their date-formatting options on their profile page
 *
 * @param any {Date} the date to be formatted
 * @return {string} the locale date
 */
export const toLocaleDate = any => {
  const current = currentLanguage()

  return (current)
    ? new Date(any).toLocaleString(current.isoCode, current.localeDateOptions)
    : new Date(any).toLocaleString()
}

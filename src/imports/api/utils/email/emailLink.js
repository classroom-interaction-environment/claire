export const emailLink = ({ user, subject, body }) => {
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  return `mailto:?subject=${encodedSubject}&body=${encodedBody}`
}

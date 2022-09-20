export const toExternalUrl = (url) => {
  if (!url || url.indexOf('//') > -1) {
    return url
  }
  return `//${url}`
}

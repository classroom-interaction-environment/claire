export const toQueryParams = (queryParams = {}) => {
  let qp = ''
  Object.entries(queryParams).forEach(([key, value]) => {
    qp += `${key}=${value}&`
  })

  if (!qp) return qp

  return `?${qp.substring(0, qp.length - 1)}`
}

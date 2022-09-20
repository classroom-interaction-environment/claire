export const addErrorDetails = (error, object) => {
  const detailsType = error.details && Object.prototype.toString.call(error.details)

  switch (detailsType) {
    case '[object Array]':
      error.details.push(object)
      return error
    case '[object Object]':
      Object.assign(error.details, object)
      return error
    default:
      error.details = Object.assign({ details: error.details })
      return error
  }
}

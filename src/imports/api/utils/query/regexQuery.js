export const regexQuery = function regexQuery (val) {
  return { $regex: new RegExp(`.*${val}.*`, 'i') }
}

const defaultDocToOption = doc => ({ value: doc._id, label: doc.title })

export const toOptions = ({ collection, query = {}, labelField }) => {
  const mapFn = labelField
    ? doc => ({ value: doc._id, label: doc[labelField] })
    : defaultDocToOption
  return function options () {
    return collection.find(query).map(mapFn)
  }
}
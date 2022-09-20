import { $in } from '../../../../../../api/utils/query/inSelector'

export const entries = function (viewState, unitDoc) {
  const { collection, field } = viewState
  const target = (unitDoc[field] || [])

  if (target.length === 0) {
    return null
  }

  const cursor = collection.find({ _id: $in(target) }, { sort: { title: 1 } })
  return cursor.count() > 0 ? cursor : null
}

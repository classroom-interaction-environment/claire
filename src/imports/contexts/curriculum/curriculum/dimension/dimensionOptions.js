import { DimensionType } from '../types/DimensionType'
import { i18n } from '../../../../api/language/language'

const byTitle = (a, b) => a.title.localeCompare(b.title)
const toDocOption = doc => ({ value: doc._id, label: doc.title })

/**
 * Create dimension form options for a given collection (local or synced).
 * @param collection
 * @return {function(): Array}
 */
export const dimensionOptions = ({ collection }) => {
  return function options () {
    const optGroups = []

    DimensionType.toArr().forEach(({ value, label }) => {
      optGroups.push({
        optgroup: i18n.get(label),
        options: collection.find({ type: value })
          .fetch()
          .sort(byTitle)
          .map(toDocOption)
      })
    })

    return optGroups
  }
}

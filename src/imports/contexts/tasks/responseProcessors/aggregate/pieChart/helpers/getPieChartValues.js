import { ResponseDataTypes } from '../../../../../../api/plugins/ResponseDataTypes'

const {
  dichotome,
  numerical,
  singleChoice,
  multipleChoice
} = ResponseDataTypes

/**
 * Gets the correct pie chart values from the results,
 * depending on the given dataType of the item.
 *
 * @param results {Array} the results array from the item response
 * @param choices {Array} the available choice (optional for some data types)
 * @param dataType {Object} a reference to one of the ResponseDataTypes
 *
 * @return {{values: Array, labels: Array, sampleSize: number}}
 */
export const getPieChartValues = ({ results, choices, dataType }) => {
  let sampleSize = 0
  let values = undefined
  let labels = []

  // single-dimension data types

  if ([dichotome, singleChoice].includes(dataType)) {
    values = []
    values.length = choices.length
    values.fill(0)

    results.forEach(result => {
      const { response } = result
      if (!response || response.length === 0) return
      const value = response[0]
      const index = choices.indexOf(value)
      values[index]++
      sampleSize++
    })

    labels = choices
  }

  else if (numerical === dataType) {
    values = {}
    results.forEach(result => {
      const { response } = result
      if (!response || response.length === 0) return

      const value = response[0]

      if (!values[value]) {
        values[value] = 0
      }

      values[value]++
      sampleSize++
    })

    labels = Object.keys(values)
  }

  // two-dimension datatypes

  else if ([multipleChoice].includes(dataType)) {
    values = []
    values.length = choices.length
    values.fill(0)

    results.forEach(result => {
      const { response } = result
      if (!response || response.length === 0) return
      response.forEach(value => {
        const index = choices.indexOf(value)
        values[index]++
      })
      sampleSize++
    })

    labels = choices
  }

  else {
    throw new TypeError(`Unexpected dataType ${dataType}`)
  }

  return { values, labels, sampleSize }
}

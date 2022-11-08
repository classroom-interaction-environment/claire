import { Template } from 'meteor/templating'
import Plotly from 'plotly.js-dist'
import { ResponseDataTypes } from '../../../../../api/plugins/ResponseDataTypes'
import './rpBarChart.html'

const { dichotome, numerical, singleChoice, multipleChoice } = ResponseDataTypes
const config = { responsive: true }
const baseLayout = {
  legend: {
    font: { size: 18 },
    x: 0,
    y: -0.5
  }
}

Template.rpBarChart.onRendered(function () {
  const instance = this
  const { api } = instance.data
  const plotTarget = instance.$('.sc-plot-target').get(0)

  // expensive init at first renderer
  Plotly.newPlot(plotTarget, [], baseLayout, config)

  api.onResize(function () {
    Plotly.relayout(plotTarget, baseLayout, config)
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { choices = [], results, api } = data
    const item = api.item()
    const dataType = api.dataType()

    const plotData = {
      type: 'bar',
      x: [],
      y: [],
      text: []
    }

    let sampleSize = 0

    if ([numerical].includes(dataType)) {
      const responses = []
      results.forEach(({ response }) => {
        if (!response || response.length === 0) return
        responses.push(Number.parseFloat(response[0] || 0))
      })

      responses.sort()

      responses.forEach((value, index) => {
        const label = String.fromCharCode(65 + index)
        plotData.x.push(label)
        plotData.y.push(value)
        plotData.text.push(value)

        // XXX: here we could actually display user names via
        // plotData.text.push(result.createdBy)
        // if we would define an action for this
        sampleSize++
      })
    }

    else if ([multipleChoice].includes(dataType)) {
      const values = []
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

      plotData.x = choices
      plotData.y = values
      plotData.text = values
    }

    else if ([dichotome, singleChoice].includes(dataType)) {
      const values = []
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

      plotData.x = choices
      plotData.y = values
      plotData.text = values
    }

    else {
      throw new TypeError(`Unexpected dataType ${dataType}`)
    }

    Plotly.react(plotTarget, [plotData])
    instance.state.set('sampleSize', sampleSize)
  })
})

Template.rpBarChart.helpers({
  sampleSize () {
    const data = Template.instance().data
    return data.results && data.results
      .filter(entry => entry.response && entry.response.length > 0).length
  }
})

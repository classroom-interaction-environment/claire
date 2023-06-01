import { Template } from 'meteor/templating'
import Plotly from 'plotly.js-dist'
import './rpPieChart.html'
import { getPieChartValues } from './helpers/getPieChartValues'

const config = { responsive: true }
const baseLayout = {
  legend: {
    font: { size: 18 },
    x: 0,
    y: -0.5
  }
}

Template.rpPieChart.setDependencies({})

Template.rpPieChart.onRendered(function () {
  const instance = this
  const { api } = instance.data
  const plotTarget = instance.$('.sc-plot-target').get(0)

  // expensive init at first render
  Plotly.newPlot(plotTarget, [], baseLayout, config)

  api.onResize(function () {
    Plotly.relayout(plotTarget, baseLayout, config)
  })

  instance.autorun(() => {
    const data = Template.currentData()
    const { choices = [], results, api } = data
    const dataType = api.dataType()
    const { values, labels, sampleSize } = getPieChartValues({
      choices,
      results,
      dataType
    })

    const plotData = [{ values, labels, type: 'pie' }]
    Plotly.react(plotTarget, plotData, baseLayout, config)
    Plotly.relayout(plotTarget, baseLayout, config)
    instance.state.set('sampleSize', sampleSize)
  })
})

Template.rpPieChart.helpers({
  sampleSize () {
    const data = Template.instance().data
    return data.results && data.results
      .filter(entry => entry.response && entry.response.length > 0).length
  }
})

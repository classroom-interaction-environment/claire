/* global Plotly $ */
import { check } from 'meteor/check'
import { i18n } from '../../../api/language/language'

export const Charts = {

  types: {
    bar: {
      value: 'bar',
      label: i18n.get('charts.bar'),
      icon: 'chart-bar'
    },
    pie: {
      value: 'pie',
      label: i18n.get('charts.pie'),
      icon: 'chart-pie'
    },
    scatter: {
      value: 'scatter',
      label: i18n.get('charts.scatter'),
      icon: 'ellipsis-h'
    },
    line: {
      value: 'line',
      label: i18n.get('charts.line'),
      icon: 'chart-line'
    },
    histogram: {
      value: 'histogram',
      label: i18n.get('charts.histogram'),
      icon: 'chart-bar'
    }
  },

  getChartTypeOptions () {
    return [{
      id: 'charts.simple',
      label: 'charts.simple',
      options: Object.values(Charts.types)
    }]
  },

  prepareData (x, y, type) {
    switch (type) {
      case Charts.types.scatter.value:
      case Charts.types.bar.value:
        return [{ type, x, y }]
      case Charts.types.pie.value:
        return [{
          type,
          values: x,
          labels: y
        }]
      case Charts.types.histogram.value:
        return [{
          type, x
        }]
      default:
        throw new Error('unknown chart type')
    }
  },

  render (options) {
    check(options, {
      target: String,
      data: [Object]
    })

    let targetObj
    try {
      targetObj = $(options.target).get(0)
      if (!targetObj) { throw new Error('element is undefined') }
    }
    catch (err) {
      console.error(err)
      // TODO alert user and reload page
      return
    }

    const layout = {
      xaxis: {
        autorange: true,
        showgrid: false,
        zeroline: false,
        showline: false,
        autotick: true,
        ticks: '',
        showticklabels: false
      },
      yaxis: {
        autorange: true,
        showgrid: true,
        zeroline: true,
        showline: false,
        autotick: true,
        ticks: '',
        showticklabels: true
      }
    }

    Plotly.newPlot(targetObj, options.data, layout)
  }

}

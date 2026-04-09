import './network.html'
import { Network } from '../Network'
import vis from 'vis-network/standalone/index'
import 'vis-network/dist/dist/vis-network.css'

const _API = Template.rpNetwork.setDependencies({
  context: [Network],
  debug: true
})

Template.rpNetwork.onRendered(function () {

  this.autorun(() => {
    const templateData = Template.currentData()
    const nodeData = templateData.results
      .flatMap(resultDoc => {
        return resultDoc.response.map((response, index) => {
          return {
            id: `${resultDoc._id}-${index}`,
            label: response,
            createdBy: resultDoc.createdBy,
            cid: 1
          }
        })
      })

    const nodes = new vis.DataSet(nodeData)

    const container = this.$('.vis-base-container').get(0)
    // provide the data in the vis format
    const data = { nodes, edges: undefined }
    const options = {
      autoResize: true,
      width: '100%',
      // Height percentual settings have only effect, if all parent height are also set to 100% - See also boocmap.css
      height: '100%',
      physics: {
        enabled: false
      },
      interaction: {
        keyboard: true
      }
    }
    const _net = new vis.Network(container, data, options)
    setTimeout(() => {

    }, 3000)
  })
})

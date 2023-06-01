/* eslint-env mocha */
import { onClientExec, onServerExec } from '../../../api/utils/archUtils'

describe('pipelines', function () {
  import './createPipeline.tests'

  onServerExec(function () {
    import '../server/buildPipeline.tests'
  })

  onClientExec(function () {
    import '../client/buildPipeline.tests'
  })
})

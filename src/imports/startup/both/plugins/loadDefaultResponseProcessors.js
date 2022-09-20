import { ResponseProcessorRegistry } from '../../../contexts/tasks/responseProcessors/ResponseProcessorRegistry'

// default contexts to register
import { PieChart } from '../../../contexts/tasks/responseProcessors/aggregate/pieChart/PieChart'
import { BarChart } from '../../../contexts/tasks/responseProcessors/aggregate/barChart/BarChart'
import { ImageGallery } from '../../../contexts/tasks/responseProcessors/aggregate/imageGallery/ImageGallery'
import { VideoGallery } from '../../../contexts/tasks/responseProcessors/aggregate/videoGallery/VideoGallery'
import { AudioList } from '../../../contexts/tasks/responseProcessors/aggregate/audioList/AudioList'
import { DocumentList } from '../../../contexts/tasks/responseProcessors/aggregate/documentList/DocumentList'
import { Cluster } from '../../../contexts/tasks/responseProcessors/aggregate/cluster/Cluster'
import { Text } from '../../../contexts/tasks/responseProcessors/aggregate/text/Text'
import { ContextRegistry } from '../../../infrastructure/context/ContextRegistry'
import { responseProcessorPipeline } from '../../../contexts/tasks/responseProcessors/responseProcessorPipeline'

import { onClientExec, onServerExec } from '../../../api/utils/archUtils'

/**
 * Here we register all internal defaults, whereas externally registered
 * RPs may already be added by packages
 */
[
  Text,
  PieChart,
  BarChart,
  ImageGallery,
  VideoGallery,
  AudioList,
  DocumentList,
  Cluster
].forEach(function (context) {
  try {
    ResponseProcessorRegistry.register(context)
  } catch (registerError) {
    console.error(`failed to register [${context.name}],see the following error:`)
    console.error(registerError)
    throw new Error()
  }
})


/**
 * This runs for all internal (default) and external registered response processors.
 * On the client this should be deferred to the point, where they are required to reduce TTS
 * and initial load volume.
 */
ResponseProcessorRegistry.forEach(function (context) {
  responseProcessorPipeline(context)

  // on the server we run the complete build pipeline
  onServerExec(function () {
    import { buildPipeline } from '../../../infrastructure/pipelines/server/buildPipeline'
    buildPipeline(context, {
      collection: true,
      filesCollection: true,
      methods: true,
      publications: true
    })
    ContextRegistry.add(context)
  })

  // on the client we use the ContextBuilder to create the context pipeline
  onClientExec(function () {
    import { initContext } from '../../client/contexts/initContext'
    initContext(context)
  })
})

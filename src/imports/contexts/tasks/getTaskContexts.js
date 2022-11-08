import { Literature , Literature } from '../resources/web/literature/Literature'

export const getTaskContexts = () => {
  import { Task } from '../curriculum/curriculum/task/Task'

  // WEB
  import { WebResources } from '../resources/web/WebResources'
  import { LinkedResource } from '../resources/web/linked/LinkedResource'
  import { EmbeddedResource } from '../resources/web/embedded/EmbeddedResource'
  
  // FILES
  import { ImageFiles } from '../files/image/ImageFiles'
  import { AudioFiles } from '../files/audio/AudioFiles'
  import { VideoFiles } from '../files/video/VideoFiles'
  import { DocumentFiles } from '../files/document/DocumentFiles'

  return [
    Task,
    WebResources,
    EmbeddedResource,
    LinkedResource,
    Literature,
    ImageFiles,
    AudioFiles,
    VideoFiles,
    DocumentFiles
  ]
}

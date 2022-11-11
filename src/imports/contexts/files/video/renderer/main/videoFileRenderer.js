import { Template } from 'meteor/templating'
import { VideoFiles } from '../../VideoFiles'
import { createDeleteFile } from '../../../shared/createDeleteFile'
import { getFilesLink } from '../../../getFilesLink'
import './videoFileRenderer.html'

const API = Template.videoFileRenderer.setDependencies({
  contexts: [VideoFiles]
})

Template.videoFileRenderer.onCreated(function () {
  const instance = this
  console.debug('video file renderer created')
  instance.state.setDefault('version', 'original')
  instance.deleteFile = createDeleteFile({
    context: VideoFiles,
    onSuccess: () => API.notify(true),
    onError: API.notify
  })
})

Template.videoFileRenderer.helpers({
  getLink (videoFile) {
    console.debug(videoFile)
    return getFilesLink({
      file: videoFile,
      name: VideoFiles.name,
      version: Template.getState('version')
    })
  },
  getPoster (videoFile) {
    if (!videoFile?.versions?.poster) {
      API.log('no poster available')
      return
    }

    return getFilesLink({
      file: videoFile,
      name: VideoFiles.name,
      version: 'poster'
    })
  },
  processingComplete (videoFile) {
    return videoFile?.processingComplete
  }
})

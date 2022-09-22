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
  instance.state.setDefault('version', 'original')
  instance.deleteFile = createDeleteFile({
    context: VideoFiles,
    onSuccess: () => API.notify(true),
    onError: API.notify
  })

  instance.autorun(() => {
    const data = Template.currentData()
    if (!data) return

    const { imageType } = data
    if (imageType) {
      instance.state.set({ version: imageType })
    }
  })
})

Template.videoFileRenderer.helpers({
  getLink (videoFile) {
    const version = Template.getState('version')
    return getFilesLink({
      file: videoFile,
      name: VideoFiles.name,
      version
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

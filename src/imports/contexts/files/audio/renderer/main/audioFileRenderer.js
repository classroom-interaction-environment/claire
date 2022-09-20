import { Template } from 'meteor/templating'
import { AudioFiles } from '../../AudioFiles'
import { createDeleteFile } from '../../../shared/createDeleteFile'
import { getFilesLink } from '../../../getFilesLink'
import './audioFileRenderer.html'

const API = Template.audioFileRenderer.setDependencies({
  contexts: [AudioFiles]
})

Template.audioFileRenderer.onCreated(function () {
  const instance = this
  instance.deleteFile = createDeleteFile({
    context: AudioFiles,
    onSuccess: () => API.notify(true),
    onError: API.notify
  })
})

Template.audioFileRenderer.helpers({
  getLink (audioFile) {
    console.debug(audioFile)
    return getFilesLink({
      file: audioFile,
      name: AudioFiles.name
    })
  }
})

Template.audioFileRenderer.events({
  'click .delete-audiofile-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.deleteFile(event)
  }
})

import { Template } from 'meteor/templating'
import { AudioFiles } from '../../AudioFiles'
import { createDeleteFile } from '../../../shared/createDeleteFile'
import { getFilesLink } from '../../../getFilesLink'
import '../../../../../ui/components/download/downloadButton'
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
    return getFilesLink({
      file: audioFile,
      name: AudioFiles.name
    })
  },
  file () {
    return Template.instance().data
  },
  collectionName () {
    return AudioFiles.name
  }
})

Template.audioFileRenderer.events({
  'click .delete-audiofile-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.deleteFile(event)
  }
})

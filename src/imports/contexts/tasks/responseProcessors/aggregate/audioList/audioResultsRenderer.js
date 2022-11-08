import { Template } from 'meteor/templating'
import { AudioFiles } from '../../../../files/audio/AudioFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import '../../../../../ui/generic/nodocs/nodocs'
import './audioResultsRenderer.html'

const TemplateAPI = Template.audioResultsRenderer.setDependencies({
  contexts: [AudioFiles]
})

const AudioCollection = getFilesCollection(AudioFiles.name)

Template.audioResultsRenderer.onCreated(function () {
  const instance = this
  const { lessonId } = instance.data
  const { taskId } = instance.data
  const { itemId } = instance.data

  TemplateAPI.subscribe({
    name: AudioFiles.publications.byItem,
    args: { lessonId, taskId, itemId },
    callbacks: {
      onReady () {
        const audioFiles = getResponseFiles({
          filesCollection: AudioCollection,
          versions: ['compressed', 'original'],
          lessonId,
          taskId,
          itemId
        })

        instance.state.set('loadComplete', true)
        instance.state.set('audioFiles', audioFiles)
      },
      onError (e) {
        console.error(e)
      }
    }
  })
})

Template.audioResultsRenderer.onDestroyed(function () {
  TemplateAPI.dispose()
})

Template.audioResultsRenderer.helpers({
  files () {
    return Template.getState('audioFiles')
  },
  loadComplete () {
    return Template.getState('loadComplete')
  },
  link (audio, version) {
    return audio.versions[version].link
  }
})

Template.audioResultsRenderer.events({
  '* audio' (event) {
    console.info(event)
  },
  'loadedmetadata audio' (event) {
    console.info(event)
  },
  'canplay audio' (event) {
    console.info(event)
  }
})

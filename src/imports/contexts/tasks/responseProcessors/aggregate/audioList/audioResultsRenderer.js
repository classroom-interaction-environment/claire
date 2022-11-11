import { Template } from 'meteor/templating'
import { AudioFiles } from '../../../../files/audio/AudioFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import '../../../../../ui/generic/nodocs/nodocs'
import './audioResultsRenderer.html'

const API = Template.audioResultsRenderer.setDependencies({
  contexts: [AudioFiles],
  debug: true
})

const AudioCollection = getFilesCollection(AudioFiles.name)

Template.audioResultsRenderer.onCreated(function () {
  const instance = this
  const { lessonId } = instance.data
  const { taskId } = instance.data
  const { itemId } = instance.data

  instance.autorun(c => {
    console.debug(AudioFiles)
    if (API.initComplete()) {
      API.subscribe({
        name: AudioFiles.publications.byItem,
        key: 'audioResultsKey',
        args: { lessonId, taskId, itemId },
        callbacks: {
          onError: error => {
            API.notify(error)
            instance.state.set('loadComplete', true)
          },
          onReady: () => {
            API.debug('sub complete')
          },
        }
      })
      c.stop()
    }
  })

  instance.autorun(() => {
    const audioFiles = getResponseFiles({
      filesCollection: AudioCollection,
      versions: ['compressed', 'original'],
      lessonId,
      taskId,
      itemId
    })

    instance.state.set('loadComplete', true)
    instance.state.set('audioFiles', audioFiles)
  })
})

Template.audioResultsRenderer.onDestroyed(function () {
  API.dispose('audioResultsKey')
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

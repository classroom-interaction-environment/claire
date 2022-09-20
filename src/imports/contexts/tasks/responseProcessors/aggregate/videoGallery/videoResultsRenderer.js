import { Template } from 'meteor/templating'
import { VideoFiles } from '../../../../files/video/VideoFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import { dataTarget } from '../../../../../ui/utils/dataTarget'
import './videoResultsRenderer.html'
import '../shared/cssbox.scss'


const API = Template.videoResultsRenderer.setDependencies({
  contexts: [VideoFiles],
  debug: false
})

const VideoFilesCollection = getFilesCollection(VideoFiles.name)

Template.videoResultsRenderer.onCreated(function () {
  const instance = this
  const { lessonId, taskId, itemId } = instance.data

  API.subscribe({
    name: VideoFiles.publications.byItem,
    args: { lessonId, taskId, itemId },
    key: 'videoResultKey',
    callbacks: {
      onError: error => {
        API.notify(error)
        instance.state.set('loadComplete', true)
      },
      onReady: () => {
        API.debug('sub complete')
      }
    }
  })

  instance.autorun(() => {
    const videos = getResponseFiles({
      filesCollection: VideoFilesCollection,
      versions: ['original'],
      lessonId,
      taskId,
      itemId
    })
    const hasVideos = !!(videos?.length)
    instance.state.set({ videos, hasVideos })
  })
})

Template.videoResultsRenderer.onDestroyed(function () {
  API.dispose('videoResultKey')
})

Template.videoResultsRenderer.helpers({
  videos () {
    return Template.getState('videos')
  },
  hasVideos () {
    return Template.getState('hasVideos')
  },
  loadComplete () {
    return API.initComplete()
  },
  link (video, version) {
    return video.versions[version].link || VideoFilesCollection.link(video, version)
  },
  prev () {
    return Template.getState('prev')
  },
  next () {
    return Template.getState('next')
  }
})

Template.videoResultsRenderer.events({
  'click .irr-thumbnail,.cssbox_prev,.cssbox_next' (event, templateInstance) {
    const id = dataTarget(event, templateInstance)
    const videos = templateInstance.state.get('videos')
    const { prev, next } = getPrevAndNext(id, videos)
    templateInstance.state.set({ prev, next })
  },
  'click .cssbox_close' (event, templateInstance) {
    templateInstance.state.set({ prev: null, next: null })
  },
  'error source' (event, templateInstance) {
    const src = dataTarget(event, templateInstance, 'src')
    const type = dataTarget(event, templateInstance, 'type')
    console.error('error loading source', src, type)
  }
})

function getPrevAndNext (id, videos) {
  const result = {}
  const index = videos.findIndex(image => image._id === id)
  if (index > 0) {
    result.prev = videos[index - 1]._id
  }
  if (index < videos.length - 1) {
    result.next = videos[index + 1]._id
  }
  return result
}

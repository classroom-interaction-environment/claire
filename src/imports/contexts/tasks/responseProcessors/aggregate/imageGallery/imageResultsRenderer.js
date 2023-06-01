import { Template } from 'meteor/templating'
import { ImageFiles } from '../../../../files/image/ImageFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import { dataTarget } from '../../../../../ui/utils/dataTarget'
import './imageResultsRenderer.scss'
import '../shared/cssbox.scss'
import './imageResultsRenderer.html'

const API = Template.imageResultsRenderer.setDependencies({
  contexts: [ImageFiles]
})

const ImageFilesCollection = getFilesCollection(ImageFiles.name)

Template.imageResultsRenderer.onCreated(function () {
  const instance = this
  const { lessonId, taskId, itemId } = instance.data

  API.subscribe({
    name: ImageFiles.publications.byItem,
    args: { lessonId, taskId, itemId },
    key: 'imageResultKey',
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
    const images = getResponseFiles({
      filesCollection: ImageFilesCollection,
      versions: ['thumbnail', 'original'],
      lessonId,
      taskId,
      itemId
    })
    const hasImages = !!(images?.length)
    instance.state.set({ images, hasImages })
  })
})

Template.imageResultsRenderer.onDestroyed(function () {
  API.dispose('imageResultKey')
})

Template.imageResultsRenderer.helpers({
  images () {
    return Template.getState('images')
  },
  hasImages () {
    return Template.getState('hasImages')
  },
  loadComplete () {
    return API.initComplete()
  },
  link (image, version) {
    return image.versions[version].link
  },
  prev () {
    return Template.getState('prev')
  },
  next () {
    return Template.getState('next')
  }
})

Template.imageResultsRenderer.events({
  'click .irr-thumbnail,.cssbox-prev,.cssbox-next' (event, templateInstance) {
    const id = dataTarget(event, templateInstance)
    const images = templateInstance.state.get('images')
    const { prev, next } = getPrevAndNext(id, images)
    templateInstance.state.set({ prev, next })
  },
  'click .cssbox-close' (event, templateInstance) {
    templateInstance.state.set({ prev: null, next: null })
  }
})

function getPrevAndNext (id, images) {
  const result = {}
  const index = images.findIndex(image => image._id === id)
  if (index > 0) {
    result.prev = images[index - 1]._id
  }
  if (index < images.length - 1) {
    result.next = images[index + 1]._id
  }
  return result
}

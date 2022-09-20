import { Template } from 'meteor/templating'
import { PDFViewerApplication } from './PDFViewerApplication'
import './pdfViewer.scss'
import './pdfViewer.html'

const API = Template.pdfViewer.setDependencies({
  loaders: [async () => await PDFViewerApplication.init()]
})

Template.pdfViewer.onCreated(async function () {
  const instance = this

  instance.renderApp = () => {
    const $container = instance.$('.viewerContainer')
    const container = $container.get(0)
    instance.viewer = new PDFViewerApplication()
    instance.viewer.init({ container })

    // The offsetParent is not set until the PDF.js iframe or object is visible;
    // waiting for first animation.
    const animationStarted = new Promise(function (resolve) {
      window.requestAnimationFrame(resolve)
    })

    // We need to delay opening until all HTML is loaded.
    animationStarted.then(function () {
      instance.viewer.open({ url: instance.data.path })
      instance.state.set('viewerRendered', true)
      // TODO use loaded event

      setTimeout(() => {
        const viewerRoot = instance.$('.pdf-viewer-root')
        const height = $container.height() || 0
        viewerRoot.css('height', `${height + 100}px`)
      }, 1000)
    })
  }
})

Template.pdfViewer.helpers({
  initComplete () {
    return API.initComplete()
  },
  fullscreen () {
    return Template.getState('fullscreen')
  },
  nextDisabled () {
    if (!API.initComplete() || !Template.getState('viewerRendered')) { return true }
    const { viewer } = Template.instance()
    return !viewer || viewer.isLast()
  },
  prevDisabled () {
    if (!API.initComplete() || !Template.getState('viewerRendered')) { return true }
    const { viewer } = Template.instance()
    return !viewer || viewer.isFirst()
  }
})

Template.pdfViewer.events({
  'click .fullscreen-btn' (event, templateInstance) {
    event.preventDefault()
    templateInstance.state.set({
      fullscreen: !templateInstance.state.get('fullscreen')
    })
  },
  'click .next-btn' (event, templateInstance) {
    event.preventDefault()
    templateInstance.viewer.next()
  },
  'click .prev-btn' (event, templateInstance) {
    templateInstance.viewer.prev()
  },
  'click .zoom-in-btn' (event, templateInstance) {
    event.preventDefault()
    templateInstance.viewer.zoomIn()
  },
  'click .zoom-out-btn' (event, templateInstance) {
    templateInstance.viewer.zoomOut()
  }
})

Template.pdfViewer.onRendered(async function () {
  const instance = this
  instance.autorun(c => {
    if (!API.initComplete()) {
      return
    }
    instance.renderApp()
    c.stop()
  })
})

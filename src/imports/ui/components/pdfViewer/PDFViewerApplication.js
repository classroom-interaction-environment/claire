import { ReactiveVar } from 'meteor/reactive-var'
import { EventBus, NullL10n, PDFHistory, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer'
import pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css'
import { createLog } from '../../../api/log/createLog'

const defaults = {
  USE_ONLY_CSS_ZOOM: true,
  TEXT_LAYER_MODE: 0, // disable
  MAX_IMAGE_SIZE: 4096 * 4096,
  CMAP_URL: '', // TODO
  CMAP_PACKED: true,
  DEFAULT_SCALE_DELTA: 1.1,
  MIN_SCALE: 0.25,
  MAX_SCALE: 10.0,
  DEFAULT_SCALE_VALUE: 'auto'
}

export class PDFViewerApplication {
  static async init () {
    // pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.min')
    pdfjsLib.GlobalWorkerOptions.workerSrc = await import('pdfjs-dist/build/pdf.worker.entry')
  }

  constructor () {
    this.pdfLoadingTask = null
    this.pdfDocument = null
    this.pdfViewer = null
    this.pdfHistory = null
    this.pdfLinkService = null
    this.eventBus = null
    this.connector = null
    this.log = createLog({ name: PDFViewerApplication.name })

    this.title = new ReactiveVar()
    this.page = new ReactiveVar(0)
    this.scale = new ReactiveVar(0)
    this.numPages = new ReactiveVar(0)
    this.progress = new ReactiveVar(0)
  }

  init ({ container }) {
    const self = this
    const eventBus = new EventBus()
    self.eventBus = eventBus

    const linkService = new PDFLinkService({ eventBus })
    self.pdfLinkService = linkService
    self.l10n = NullL10n

    const pdfViewer = new PDFViewer({
      container: container,
      eventBus,
      linkService,
      l10n: self.l10n,
      useOnlyCssZoom: defaults.USE_ONLY_CSS_ZOOM,
      textLayerMode: defaults.TEXT_LAYER_MODE
    })
    self.pdfViewer = pdfViewer
    linkService.setViewer(pdfViewer)

    self.pdfHistory = new PDFHistory({
      eventBus,
      linkService
    })
    linkService.setHistory(self.pdfHistory)

    eventBus.on('pagesinit', function () {
      // We can use pdfViewer now, e.g. let's change default scale.
      pdfViewer.currentScaleValue = defaults.DEFAULT_SCALE_VALUE
      self.page.set(pdfViewer.currentPageNumber)
      self.numPages.set(self.pdfDocument.numPages)
      console.debug('pages init', self.page.get(), '/', self.numPages.get())
    })

    eventBus.on('pagechanging', function (evt) {
      self.page.set(evt.pageNumber)
    }, true)
  }

  /**
   * Opens PDF document specified by URL.
   * @returns {Promise} - Returns the promise, which is resolved when document
   *                      is opened.
   */
  open (params) {
    if (this.pdfLoadingTask) {
      // We need to destroy already opened document
      return this.close().then(function () {
        // ... and repeat the open() call.
        return this.open(params)
      }.bind(this))
    }

    const url = params.url
    const self = this
    this.setTitleUsingUrl(url)

    // Loading document.
    const loadingTask = pdfjsLib.getDocument({
      url,
      maxImageSize: defaults.MAX_IMAGE_SIZE,
      cMapUrl: defaults.CMAP_URL,
      cMapPacked: defaults.CMAP_PACKED
    })
    this.pdfLoadingTask = loadingTask

    loadingTask.onProgress = function (progressData) {
      self.progress.set(progressData)
    }

    return loadingTask.promise.then(
      function (pdfDocument) {
        // Document loaded, specifying document for the viewer.
        self.pdfDocument = pdfDocument
        self.pdfViewer.setDocument(pdfDocument)
        self.pdfLinkService.setDocument(pdfDocument)
        self.pdfHistory.initialize({
          fingerprint: pdfDocument.fingerprints[0]
        })

        self.setTitleUsingMetadata(pdfDocument)
      },
      function (exception) {
        const message = exception && exception.message
        const l10n = self.l10n
        let loadingErrorMessage

        if (exception instanceof pdfjsLib.InvalidPDFException) {
          // change error message also for other builds
          loadingErrorMessage = l10n.get(
            'invalid_file_error',
            null,
            'Invalid or corrupted PDF file.'
          )
        } else if (exception instanceof pdfjsLib.MissingPDFException) {
          // special message for missing PDFs
          loadingErrorMessage = l10n.get(
            'missing_file_error',
            null,
            'Missing PDF file.'
          )
        } else if (exception instanceof pdfjsLib.UnexpectedResponseException) {
          loadingErrorMessage = l10n.get(
            'unexpected_response_error',
            null,
            'Unexpected server response.'
          )
        } else {
          loadingErrorMessage = l10n.get(
            'loading_error',
            null,
            'An error occurred while loading the PDF.'
          )
        }

        loadingErrorMessage.then(function (msg) {
          self.error(msg, { message })
        })
      }
    )
  }

  /**
   * Closes opened PDF document.
   * @returns {Promise} - Returns the promise, which is resolved when all
   *                      destruction is completed.
   */
  close () {
    const errorWrapper = document.getElementById('errorWrapper')
    errorWrapper.hidden = true

    if (!this.pdfLoadingTask) {
      return Promise.resolve()
    }

    const promise = this.pdfLoadingTask.destroy()
    this.pdfLoadingTask = null

    if (this.pdfDocument) {
      this.pdfDocument = null

      this.pdfViewer.setDocument(null)
      this.pdfLinkService.setDocument(null, null)

      if (this.pdfHistory) {
        this.pdfHistory.reset()
      }
    }

    return promise
  }

  setTitleUsingUrl (url) {
    this.url = url
    let title = pdfjsLib.getFilenameFromUrl(url) || url
    try {
      title = decodeURIComponent(title)
    } catch (e) {
      // decodeURIComponent may throw URIError,
      // fall back to using the unprocessed url in that case
    }
    this.setTitle(title)
  }

  setTitleUsingMetadata (pdfDocument) {
    const self = this
    pdfDocument.getMetadata().then(function (data) {
      const info = data.info
      const metadata = data.metadata
      self.documentInfo = info
      self.metadata = metadata

      // Provides some basic debug information
      self.log(
        'PDF ' +
        pdfDocument.fingerprints[0] +
        ' [' +
        info.PDFFormatVersion +
        ' ' +
        (info.Producer || '-').trim() +
        ' / ' +
        (info.Creator || '-').trim() +
        ']' +
        ' (PDF.js: ' +
        (pdfjsLib.version || '-') +
        ')'
      )

      let pdfTitle
      if (metadata && metadata.has('dc:title')) {
        const title = metadata.get('dc:title')
        // Ghostscript sometimes returns 'Untitled', so prevent setting the
        // title to 'Untitled.
        if (title !== 'Untitled') {
          pdfTitle = title
        }
      }

      if (!pdfTitle && info && info.Title) {
        pdfTitle = info.Title
      }

      if (pdfTitle) {
        self.setTitle(pdfTitle + ' - ' + document.title)
      }
    })
  }

  setTitle (title) {
    this.title.set(title)
  }

  error (message, moreInfo) {
    const l10n = this.l10n
    const moreInfoText = [
      l10n.get(
        'error_version_info',
        { version: pdfjsLib.version || '?', build: pdfjsLib.build || '?' },
        'PDF.js v{{version}} (build: {{build}})'
      )
    ]

    if (moreInfo) {
      moreInfoText.push(
        l10n.get(
          'error_message',
          { message: moreInfo.message },
          'Message: {{message}}'
        )
      )
      if (moreInfo.stack) {
        moreInfoText.push(
          l10n.get('error_stack', { stack: moreInfo.stack }, 'Stack: {{stack}}')
        )
      } else {
        if (moreInfo.filename) {
          moreInfoText.push(
            l10n.get(
              'error_file',
              { file: moreInfo.filename },
              'File: {{file}}'
            )
          )
        }
        if (moreInfo.lineNumber) {
          moreInfoText.push(
            l10n.get(
              'error_line',
              { line: moreInfo.lineNumber },
              'Line: {{line}}'
            )
          )
        }
      }
    }

    const errorWrapper = document.getElementById('errorWrapper')
    errorWrapper.hidden = false

    const errorMessage = document.getElementById('errorMessage')
    errorMessage.textContent = message

    const closeButton = document.getElementById('errorClose')
    closeButton.onclick = function () {
      errorWrapper.hidden = true
    }

    const errorMoreInfo = document.getElementById('errorMoreInfo')
    const moreInfoButton = document.getElementById('errorShowMore')
    const lessInfoButton = document.getElementById('errorShowLess')
    moreInfoButton.onclick = function () {
      errorMoreInfo.hidden = false
      moreInfoButton.hidden = true
      lessInfoButton.hidden = false
      errorMoreInfo.style.height = errorMoreInfo.scrollHeight + 'px'
    }
    lessInfoButton.onclick = function () {
      errorMoreInfo.hidden = true
      moreInfoButton.hidden = false
      lessInfoButton.hidden = true
    }
    moreInfoButton.hidden = false
    lessInfoButton.hidden = true
    Promise.all(moreInfoText).then(function (parts) {
      errorMoreInfo.value = parts.join('\n')
    })
  }

  prev () {
    this.pdfViewer.currentPageNumber--
    this.page.set(this.pdfViewer.currentPageNumber)
  }

  next () {
    this.pdfViewer.currentPageNumber++
    this.page.set(this.pdfViewer.currentPageNumber)
  }

  isFirst () {
    console.debug('is first', this.page.get())
    return this.page.get() === 1
  }

  isLast () {
    console.debug('is last', this.page.get(), this.numPages.get())
    return this.page.get() === this.numPages.get()
  }

  zoomIn (ticks) {
    let newScale = this.pdfViewer.currentScale
    do {
      newScale = (newScale * defaults.DEFAULT_SCALE_DELTA).toFixed(2)
      newScale = Math.ceil(newScale * 10) / 10
      newScale = Math.min(defaults.MAX_SCALE, newScale)
    } while (--ticks && newScale < defaults.MAX_SCALE)
    this.pdfViewer.currentScaleValue = newScale
    this.scale.set(newScale)
  }

  zoomOut (ticks) {
    let newScale = this.pdfViewer.currentScale
    do {
      newScale = (newScale / defaults.DEFAULT_SCALE_DELTA).toFixed(2)
      newScale = Math.floor(newScale * 10) / 10
      newScale = Math.max(defaults.MIN_SCALE, newScale)
    } while (--ticks && newScale > defaults.MIN_SCALE)
    this.pdfViewer.currentScaleValue = newScale
    this.scale.set(newScale)
  }
}

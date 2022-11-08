import { Template } from 'meteor/templating'
import { createDeleteFile } from '../../../shared/createDeleteFile'
import { DocumentFiles } from '../../DocumentFiles'
import { getFilesLink } from '../../../getFilesLink'
import { asyncTimeout } from '../../../../../api/utils/asyncTimeout'
import PDFObject from 'pdfobject'
import './documentFileRenderer.scss'
import './documentFileRenderer.html'

const API = Template.documentFileRenderer.setDependencies({
  contexts: [DocumentFiles]
})

API.useFallback = false

Template.documentFileRenderer.onCreated(function () {
  const instance = this
  instance.deleteFile = createDeleteFile({
    context: DocumentFiles,
    onSuccess: () => API.notify(true),
    onError: API.notify
  })
})

Template.documentFileRenderer.onRendered(function () {
  const instance = this
  const { data } = instance

  instance.renderPDFJSFallback = async () => {
    await import('../../../../../ui/components/pdfViewer/pdfViewer')
    await asyncTimeout(300)
    instance.state.set('fallback', true)
    await asyncTimeout(500)
    instance.$('.pdfobject-container').hide()
    API.useFallback = true
  }

  if (data?.isPDF) {
    const pdfUrl = getFilesLink({
      file: data,
      name: DocumentFiles.name
    })

    instance.state.set({ pdfUrl })

    if (!API.useFallback && PDFObject.supportsPDFs) {
      PDFObject.embed(pdfUrl, document.querySelector('.pdf-target'), {
        height: '60vh',
        title: data.name,
        pdfOpenParams: {
          comment: 'A comment',
          view: 'Fit',
          pagemode: 'none',
          scrollbar: '1',
          toolbar: '1',
          statusbar: '1',
          messages: '1',
          navpanes: '1'
        },
        fallbackLink: `<p>${pdfUrl}?download=true</p>`// `<p>${i18n.get('files.noPDF')} <a href="" download="${data.name}" target="_top">${i18n.get('actions.download')}</a></p>`
      })

      setTimeout(() => {
        const $pdfObject = instance.$('.pdfobject')

        if ($pdfObject.get(0)) {
          API.log('PDF rendered natively')
        }

        // in such case we need to load pdf-js
        else {
          API.log('PDF not natively supported')
          instance.renderPDFJSFallback(pdfUrl).catch(API.notify)
        }
      }, 500)
    }
    else {
      API.log('no native PDF support')
      instance.renderPDFJSFallback().catch(API.notify)
    }
  }
})

Template.documentFileRenderer.helpers({
  getLink (documentFile) {
    return getFilesLink({
      file: documentFile,
      name: DocumentFiles.name
    })
  },
  fallback () {
    return Template.getState('fallback')
  },
  pdfUrl () {
    return Template.getState('pdfUrl')
  }
})

Template.documentFileRenderer.events({
  'click .delete-docfile-button' (event, templateInstance) {
    event.preventDefault()
    templateInstance.deleteFile(event)
  },
  'click .use-fallback' (event, templateInstance) {
    event.preventDefault()
    const pdfUrl = templateInstance.state.get('pdfUrl')
    templateInstance.renderPDFJSFallback(pdfUrl)
  }
})

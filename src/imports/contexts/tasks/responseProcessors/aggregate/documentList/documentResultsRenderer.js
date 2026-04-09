import { Template } from 'meteor/templating'
import { DocumentFiles } from '../../../../files/document/DocumentFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import '../../../../../ui/components/download/downloadButton'
import './documentResultsRenderer.html'
import { getFilesLink } from '../../../../files/getFilesLink'

const API = Template.documentResultsRenderer.setDependencies({
  contexts: [DocumentFiles]
})
const DocumentFilesCollection = getFilesCollection(DocumentFiles.name)

Template.documentResultsRenderer.onCreated(function () {
  const { lessonId, taskId, itemId } = this.data
  API.subscribe({
    name: DocumentFiles.publications.byItem,
    args: { lessonId, taskId, itemId },
    key: 'documentResultsSub',
    callbacks: {
      onError: error => {
        API.notify(error)
        this.state.set('loadComplete', true)
      },
      onReady: () => {
        API.debug('sub complete')
      }
    }
  })

  this.autorun(() => {
    const documents = getResponseFiles({
      filesCollection: DocumentFilesCollection,
      versions: ['original'],
      lessonId,
      taskId,
      itemId
    })
    const hasDocs = !!(documents?.length)
    this.state.set({ documents, hasDocs })
  })
})

Template.documentResultsRenderer.onDestroyed(() => {
  API.dispose('documentResultsSub')
})

Template.documentResultsRenderer.helpers({
  documents () {
    return Template.getState('documents')
  },
  hasDocs () {
    return Template.getState('hasDocs')
  },
  link (doc, version = 'original') {
    return doc.versions?.[version]?.link
  },
  loadComplete () {
    return API.initComplete()
  },
  collectionName () {
    return DocumentFiles.name
  },
  hasThumbnail (fileObj = {}) {
    return fileObj.isPDF && fileObj.versions?.thumbnail
  },
  getThumbnail (fileObj) {
    return getFilesLink({
      file: fileObj,
      name: DocumentFiles.name,
      version: 'thumbnail'
    })
  },
  getIcon (extension) {
    switch (extension) {
      case 'pdf':
        return 'file-pdf'
      case 'doc':
      case 'docx':
      case 'odt':
      case 'odf':
        return 'file-alt'
      case 'ppt':
      case 'pptx':
      case 'odp':
        return 'file-powerpoint'
      case 'xls':
      case 'xlsx':
      case 'ods':
        return 'file-excel'
      default:
        return 'file-alt'
    }
  }
})

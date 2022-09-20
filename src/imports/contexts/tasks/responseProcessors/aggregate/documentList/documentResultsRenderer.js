import { Template } from 'meteor/templating'
import { DocumentFiles } from '../../../../files/document/DocumentFiles'
import { getResponseFiles } from '../../getResponseFiles'
import { getFilesCollection } from '../../../../../api/utils/getFilesCollection'
import './documentResultsRenderer.html'

const API = Template.documentResultsRenderer.setDependencies({
  contexts: [DocumentFiles]
})
const DocumentFilesCollection = getFilesCollection(DocumentFiles.name)

Template.documentResultsRenderer.onCreated(function () {
  const instance = this
  const { lessonId, taskId, itemId } = instance.data
  API.subscribe({
    name: DocumentFiles.publications.byItem,
    args: { lessonId, taskId, itemId },
    key: 'documentResultsSub',
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
    const documents = getResponseFiles({
      filesCollection: DocumentFilesCollection,
      versions: ['original'],
      lessonId,
      taskId,
      itemId
    })
    const hasDocs = !!(documents?.length)
    instance.state.set({ documents, hasDocs })
  })
})

Template.documentResultsRenderer.onDestroyed(function () {
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
    console.debug(doc)
    return doc.versions?.[version]?.link
  },
  loadComplete () {
    return API.initComplete()
  }
})

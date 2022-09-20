import { Template } from 'meteor/templating'
import { Files } from '../../../contexts/files/Files'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'
import { getFilesCollection } from '../../../api/utils/getFilesCollection'
import { loadIntoCollection } from '../../../infrastructure/loading/loadIntoCollection'
import './fileRenderer.html'

const API = Template.fileRenderer.setDependencies()

Template.fileRenderer.onCreated(function () {
  const instance = this

  instance.autorun(() => {
    const data = Template.currentData()
    if (!data) { return }

    const fileId = data._id
    const contextName = data.meta

    // loading file

    const collection = getLocalCollection(contextName)

    if (!collection.findOne(fileId)) {
      API.log('load file', contextName, fileId)

      loadIntoCollection({
        name: `${contextName}.methods.get`,
        args: { _id: fileId },
        collection: collection,
        failure: API.notify
      })
    }

    // loading renderer template

    if (instance.state.get(contextName)) { return } // skip already loaded

    const renderer = Files.helpers.getRenderer(contextName)
    const { template, load } = renderer
    API.log('load template', template, ' for ', contextName)

    load()
      .catch(e => API.notify(e))
      .then(() => {
        API.log(template, 'loaded')
        instance.state.set({ [contextName]: template })
      })
  })
})

Template.fileRenderer.helpers({
  fileTemplate (meta) {
    return Template.getState(meta)
  },
  fileResource (doc) {
    if (!doc) return

    const data = getData(doc)
    if (!data) return

    data.student = doc.student
    data.preview = doc.preview
    data.pring = doc.print
    data.version = doc.version

    return data
  },
  initialized (meta) {
    return Template.getState(meta)
  }
})

function getData (doc) {
  if (doc.data) return doc.data
  if (!doc.meta || !doc._id) return

  const filesDoc = getLocalCollection(doc.meta).findOne(doc._id)
  if (filesDoc) return filesDoc

  return getFilesCollection(doc.meta).findOne(doc._id)
}

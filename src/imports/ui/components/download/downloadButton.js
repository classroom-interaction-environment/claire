import { getFilesLink } from '../../../contexts/files/getFilesLink'
import './downloadButton.html'

Template.downloadButton.helpers({
  fileLink () {
    const { file, collection } = Template.instance().data
    return getFilesLink({ file, name: collection })
  }
})
import { Template } from 'meteor/templating'
import { DocumentFiles } from '../../DocumentFiles'
import '../../../../../ui/components/download/downloadButton'
import './documentFilesListRenderer.html'

Template.documentFilesListRenderer.helpers({
  collectionName () {
    return DocumentFiles.name
  },
  icon (extension) {
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

import { Template } from 'meteor/templating'
import './documentFilesListRenderer.html'

Template.documentFilesListRenderer.helpers({
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
        throw new Error('unexpected extension')
    }
  }
})

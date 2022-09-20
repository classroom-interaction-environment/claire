export const FilesTemplates = {
  upload: {
    type: 'customFileUpload',
    template: 'afCustomFileUpload',
    // type: 'fileUpload',
    // template: 'caroFileUpload',
    load: async function () {
      // await import('meteor/ostrio:autoform-files')
      return import('./shared/templates/upload/fileUpload')
      // return import('./shared/templates/fileUpload')
    }
  },
  renderer: {
    template: 'otherFilePreview', // TODO rename to filePreviewFallback
    load: async function () {
      return import('./shared/templates/otherFilePreview')
    }
  }
}

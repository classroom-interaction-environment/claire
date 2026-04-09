export const FilesTemplates = {
  upload: {
    type: 'customFileUpload',
    template: 'afCustomFileUpload',
    // type: 'fileUpload',
    // template: 'caroFileUpload',
    load: async () => {
      // await import('meteor/ostrio:autoform-files')
      return import('./shared/templates/upload/fileUpload')
      // return import('./shared/templates/fileUpload')
    }
  },
  renderer: {
    template: 'otherFilePreview', // TODO rename to filePreviewFallback
    load: async () => import('./shared/templates/otherFilePreview')
  }
}

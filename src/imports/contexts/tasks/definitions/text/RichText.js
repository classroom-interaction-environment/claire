export const RichText = {
  name: 'rt',
  label: 'text.richtext',
  icon: 'align-justify',
  schema: ({ translate }) => {
    return {
      static: {
        type: String,
        label: translate('text.richtext'),
        autoform: {
          type: 'trix',
          afFieldInput: {
            autofocus: ''
          }
          /*
           events: {
           attachmentAdd ($event) {
           const { originalEvent } = $event
           if (originalEvent.attachment && originalEvent.attachment.file) {
           const { file } = originalEvent.attachment
           const ImageFilesCollection = getCollection(ImageFiles).filesCollection
           const opts = Object.assign({}, defaultInsertOpts, { file })
           const upload = ImageFilesCollection.insert(opts, false)

           upload.on('start', function () {
           })

           upload.on('error', function (error) {
           // ctx.addValidationErrors([{name: template.inputName, type: 'uploadError', value: error.reason}]);
           // template.$(e.currentTarget).val('');
           console.error(error)
           })

           upload.on('end', function (error, fileObj) {
           if (error) {
           console.error(error)
           }
           else {
           const link = ImageFilesCollection.link(fileObj, 'original')
           originalEvent.attachment.setUploadProgress(100)
           originalEvent.attachment.setAttributes({
           url: link,
           href: null,
           _id: fileObj._id
           })
           }
           })

           upload.start()
           }
           },
           attachmentRemove ($event) {
           const { originalEvent } = $event
           try {
           const fileId = originalEvent.attachment.attachment.attributes.values._id
           const ImageFilesCollection = getCollection(ImageFiles).filesCollection
           ImageFilesCollection.remove({ _id: fileId })
           } catch (e) {
           console.error(e)
           }
           }
           }
           */
        }
      }
    }
  },
  form: async () => {
    await import('trix/dist/trix')
    await import('trix/dist/trix.css')
    const loadAutoFormTrix = await import('meteor/jkuester:autoform-trix')
    return loadAutoFormTrix.default()
  },
  load: async () => {
    await import('trix/dist/trix')
    await import('trix/dist/trix.css')
  }
}

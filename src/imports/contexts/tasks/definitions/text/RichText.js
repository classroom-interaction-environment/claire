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
            autofocus: '',
            attachments: false,
            events: {
              attachmentAdd: false,
              attachmentRemove: false,
              fileAccept: false
            }
          }
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

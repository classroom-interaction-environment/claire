export const StaticTextSchema = ({ translate }) => ({
  static: {
    type: String,
    label: translate('text.text'),
    autoform: {
      type: 'textarea',
      rows: 8,
      afFieldInput: {
        autofocus: ''
      }
    }
  }
})

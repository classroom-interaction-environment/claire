export const H5PUserContentCollection = {
  name: 'h5p-content-user-data',
  collection: null,
  schema: {
    contentId: {
      type: String,
      optional: true
    },
    dataType: String,
    subContentId: String,
    userState: String,
    userId: String,
    preload: Boolean,
    invalidate: Boolean
  }
}

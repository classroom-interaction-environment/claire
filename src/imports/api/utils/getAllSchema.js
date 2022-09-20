export const getAllSchema = {
  _id: {
    type: Object,
    optional: true
  },
  '_id.$in': {
    type: Array
  },
  '_id.$in.$': {
    type: String
  }
}

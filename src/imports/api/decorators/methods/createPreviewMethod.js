import { onServerExec } from '../../utils/archUtils'

export const createPreviewMethod = (context) => {
  return {
    name: `${context.name}.methods.preview`,
    schema: {
      _id: String,
      token: String
    },
    run: onServerExec(function () {
      import { getCollection } from '../../utils/getCollection'

      return function ({ _id, token }) {
        const collection = getCollection(context.name)
        // TODO validate token
        return collection.findOne({ _id })
      }
    })
  }
}
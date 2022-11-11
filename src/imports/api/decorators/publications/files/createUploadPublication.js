import { onServer } from '../../../utils/archUtils'
import { getCollection } from '../../../utils/getCollection'

export const createUploadPublication = ({ name }) => {
  return {
    upload: {
      name: `${name}.publications.upload`,
      schema: {
        _id: String
      },
      run: onServer(function ({ _id }) {
        const { userId } = this
        const query = { _id, userId }
        return getCollection(name).find(query)
      })
    }
  }
}

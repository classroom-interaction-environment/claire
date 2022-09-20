import { callMethod } from './callMethod'
import { getLocalCollection } from '../../../infrastructure/collection/getLocalCollection'

/**
 * TODO rename to removeDoc
 * @param context
 * @param _id
 * @param timeout
 * @param prepare
 * @param receive
 * @param success
 * @param failure
 */
export const removeContextDoc = ({ context, _id, timeout, prepare, receive, success, failure }) => {
  if (context.isFilesCollection) {
    return callMethod({
      name: context.methods.delete.name,
      args: { _id },
      timeout,
      receive,
      failure,
      success: result => {
        const localCollection = getLocalCollection(context.name)
        localCollection.remove(_id)
        success(result)
      }
    })
  }

  else {
    return callMethod({
      name: context.methods.remove.name,
      args: { _id },
      timeout,
      receive,
      failure,
      success: result => {
        const localCollection = getLocalCollection(context.name)
        localCollection.remove(_id)
        success(result)
      }
    })
  }
}

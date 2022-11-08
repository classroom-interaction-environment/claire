import { Files } from './Files'
import { getLocalCollection } from '../../infrastructure/collection/getLocalCollection'
import { isMaterial } from '../material/isMaterial'
import { callMethod } from '../../ui/controllers/document/callMethod'
import { createLog } from '../../api/log/createLog'

export const loadAllFilesForTask = ({ taskId }) => {
  const allCtx = Files.all().filter(ctx => ctx && isMaterial(ctx))
  debug('load for', taskId)

  return Promise.all(allCtx.map(ctx => {
    callMethod({
      name: ctx.methods.editor,
      args: { meta: { taskId } },
      success: (fileDocs = []) => {
        debug('for', taskId, ctx.name, 'received', fileDocs.length)

        const localCollection = getLocalCollection(ctx.name)
        fileDocs.forEach(doc => {
          localCollection.upsert(doc._id, { $set: doc })
        })
        return fileDocs
      }
    })
  }))
}

const debug = createLog({
  name: loadAllFilesForTask.name,
  type: 'debug'
})

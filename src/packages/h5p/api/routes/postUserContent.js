import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

/**
 * Updates the user content by given data from the body
 * @return {(function(*, *): Promise<void>)|*}
 */
export const postUserContent = () => async (req, res) => {
  const { contentId, dataType, subContentId } = req.params
  const { body } = req
  const user = req.user && req.user()

  await H5PFactory.editor().contentUserDataManager.createOrUpdateContentUserData(
    contentId,
    dataType,
    subContentId,
    body.data,
    body.invalidate === 1 || body.invalidate === '1',
    body.preload === 1 || body.preload === '1',
    new H5PUser(user)
  )

  res.writeHead(200)
  res.end()
}

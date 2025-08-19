import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'

export const getUserContent = () => async (req, res) => {
  const user = req.user && req.user()
  const { contentId, dataType, subContentId } = req.params
  const userContent = await H5PFactory.editor().contentUserDataManager.getContentUserData(
    contentId,
    dataType,
    subContentId,
    new H5PUser(user)
  )

  if (!userContent) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ data: undefined, success: false }))
  }
  else {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ data: userContent, success: true }))
  }
}

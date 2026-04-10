import { H5PTranslation } from '../H5PTranslation'
import H5PUser from '../implementations/H5PUser'

/**
 * @private
 */
const multerToExpressFile = (f) => ({
  mimetype: f.mimetype,
  name: f.originalname,
  size: f.size,
  tempFilePath: f.path
})

export const postAjax = ajaxEndpoint => async (req, res) => {
  const user = req.user && req.user()
  const language = req.query.language || req.Cookies.get('h5p-editor-lang') || H5PTranslation.getLocale()
  const result = await ajaxEndpoint.postAjax(
    // action
    req.query.action,
    // body
    req.body,
    // language
    language,
    // user
    new H5PUser(user),
    // filesFile
    req.files && req.files.file
      ? multerToExpressFile(req.files.file[0])
      : undefined,
    // id
    req.query.id,
    // translate (fn)
    req.t,
    // libraryUploadFile
    req.files && req.files.h5p
      ? multerToExpressFile(req.files.h5p[0])
      : undefined
  )
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify(result))
  res.end()
}

import H5PUser from '../implementations/H5PUser'
import { H5PFactory } from '../H5PFactory'
/*
 First get ContentUserDataManager from H5PEditor or H5PPlayer.
 Route this endpoint and return HTTP status code 200 with a JSON
 object that is based on AjaxSuccessResponse with empty payload:

 POST {{setFinishedUrl}}/ -> ContentUserDataManager.setFinished
 */
export const postFinishedData = () => async (req, res) => {
  if (!H5PFactory.editor().config.setFinishedEnabled) {
    res.writeHead(403)
    return res.end()
  }

  const { body } = req
  const user = req.user && req.user()
  const { contentId } = body
  const score = Number.parseInt(body.score, 10)
  const maxScore = Number.parseInt(body.maxScore, 10)
  const opened = Number.parseInt(body.opened, 10) * 1000
  const finished = Number.parseInt(body.finished, 10) * 1000
  const time = finished - opened

  if ([opened, finished, time, score, maxScore].some(n => Number.isNaN(n))) {
    return fail(res)
  }

  try {
    await H5PFactory.editor().contentUserDataManager.setFinished(
      contentId,
      score,
      maxScore,
      opened,
      finished,
      time,
      new H5PUser(user)
    )
  }
  catch (e) {
    return fail(res)
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify({ data: undefined, success: true }))
  res.end()
}

const fail = res => {
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.write(JSON.stringify({ data: undefined, success: false }))
  return res.end()
}

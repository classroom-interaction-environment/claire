import { H5PFactory } from '../H5PFactory'

export const getTheme = () => async (req, res) => {
  const themeCss = H5PFactory.editor().renderTheme()
  res.writeHead(200, { 'Content-Type': 'text/css' })
  res.write(themeCss)
  res.end()
}

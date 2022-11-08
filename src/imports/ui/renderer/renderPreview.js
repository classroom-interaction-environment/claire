import { Routes } from '../../api/routes/Routes'
import { openWindow } from '../utils/browser/windowUtils'

export const renderPreview = ({ docId, context }) => {
  const token = encodeURIComponent('01234567890')
  const location = Routes.preview.path(context, docId, token)
  return openWindow(location)
}
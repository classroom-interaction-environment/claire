import { resetBeamer } from './resetBeamer'
import { removeDocuments } from './removeDocuments'
import { removeGroups, resetGroups } from './resetGroups'
import { createRemoveAllMaterial } from '../../../material/createRemoveAllMaterial'

/**
 * @type {function({unitDoc: string, userId: string}): number}
 */
const removeAllMaterial = createRemoveAllMaterial({ isCurriculum: false })

export const LessonRuntime = {

  name: 'lesson.runtime',
  /**
   * @type {string}
   */
  resetBeamer: resetBeamer,
  /**
   * @type {function}
   */
  removeDocuments: removeDocuments,
  removeGroups: removeGroups,
  /**
   * @type {function}
   */
  resetGroups: resetGroups,
  removeAllMaterial: removeAllMaterial
}

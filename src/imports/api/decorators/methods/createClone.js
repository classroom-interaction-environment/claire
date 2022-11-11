import { DocNotFoundError } from '../../errors/types/DocNotFoundError'
import { checkOwnership } from '../../utils/permission/checkOnwership'
import { createLog } from '../../log/createLog'
import { isCurriculumDoc } from './isCurriculumDoc'
import { checkCurriculum } from './checkCurriculum'

export const createClone = (collectionName, { owner, isCurriculum } = {}) => {
  const info = createLog( { name: collectionName })
  let collection

  return function ({ _id }) {
    const { userId } = this
    const original = (owner && !isCurriculum)
      ? checkOwnership(collection, { _id }, userId)
      : collection.findOne(_id)

    if (!original) {
      throw new DocNotFoundError('methods.createClone', { _id })
    }

    if (isCurriculumDoc(original)) {
      checkCurriculum({ isCurriculum, userId, _id })
    }

    delete original._id

    info('clone', _id)
    return collection.insert(original)
  }
}

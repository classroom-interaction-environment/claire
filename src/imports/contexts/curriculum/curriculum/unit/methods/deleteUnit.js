import { createRemoveAllMaterial } from '../../../../material/createRemoveAllMaterial'
import { getCollection } from '../../../../../api/utils/getCollection'
import { ensureDocumentExists } from '../../../../../api/utils/document/ensureDocumentExists'
import { checkOwnership } from '../../../../../api/utils/document/checkOwnership'
import { Unit } from '../Unit'

const removeAllMaterial = createRemoveAllMaterial({ isCurriculum: true })

export const deleteUnit = async ({ unitId, userId }) => {
  const UnitCollection = getCollection(Unit.name)
  const unitDoc = await UnitCollection.findOneAsync({ _id: unitId, _master: true })

  await ensureDocumentExists({
    document: unitDoc,
    userId: userId,
    docId: unitId,
    name: Unit.name
  })

  await checkOwnership({
    document: unitDoc,
    userId: userId,
    context: Unit.name
  })

  // this removes all material that is related to the unit doc, which
  // can have several implications, if the material is in use anywhere
  // a future versioning of curricula should prevent such issues
  await removeAllMaterial({ unitDoc, userId })

  return UnitCollection.removeAsync({ _id: unitId })
}
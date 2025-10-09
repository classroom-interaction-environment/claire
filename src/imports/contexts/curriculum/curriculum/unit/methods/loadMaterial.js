import { getCollection } from '../../../../../api/utils/getCollection'
import { loadAllMaterialByUnit } from '../../../../material/loadAllMaterialByUnit'
import { Unit } from '../Unit'
import { checkOwnership } from '../../../../../api/utils/permission/checkOnwership'

export const loadMaterial = async ({ unitId, userId }) => {
  const UnitCollection = getCollection(Unit.name)
  const unitDoc = await UnitCollection.findOneAsync({ _id: unitId })

  // master docs are readable by all teachers for now
  // non-master docs have to be checked for ownership
  // so users can't loader other users' docs
  if (!unitDoc._master) {
    await checkOwnership({ doc: unitDoc, docId: unitId, userId })
  }

  return loadAllMaterialByUnit(unitDoc, userId)
}
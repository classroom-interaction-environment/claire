import { getCollection } from '../../../../../api/utils/getCollection'
import { Unit } from '../Unit'
import { createDocGetter } from '../../../../../api/utils/document/createDocGetter'

const checkUnitDoc = createDocGetter({ name: Unit.name })

export const unlinkUnitTask = async ({ userId, taskId }) => {
  const UnitCollection = getCollection(Unit.name)
  const query = { createdBy: userId, tasks: { $in: [taskId] } }
  await checkUnitDoc(query)
  const modifier = { $pull: { tasks: taskId } }
  return UnitCollection.updateAsync(query, modifier)
}

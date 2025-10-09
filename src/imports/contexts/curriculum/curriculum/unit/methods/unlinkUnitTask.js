import { getCollection } from '../../../../../api/utils/getCollection'
import { Unit } from '../Unit'

export const unlinkUnitTask = async ({ userId, taskId }) => {
  const UnitCollection = getCollection(Unit.name)
  const query = { createdBy: userId, tasks: { $in: [taskId] } }
  const modifier = { $pull: { tasks: taskId } }
  return UnitCollection.updateAsync(query, modifier)
}
/**
 * handle different queries for curriculum units and copy units
 *
 * @param materialIds
 * @param userId
 * @param isCurriculum
 */
export const createMaterialQuery = (materialIds, userId, isCurriculum) => {
  const query = {
    _id: { $in: materialIds }
  }

  if (isCurriculum) {
    query._master = true
  }

  else {
    query._master = { $exists: false }
    query.createdBy = userId
  }

  return query
}

import { userIsCurriculum } from "../../../../../api/accounts/userIsCurriculum";
import { getCollection } from "../../../../../api/utils/getCollection";
import { Unit } from "../Unit";

export const getUnitsByTaskId = async ({ userId, taskId }) => {
	const UnitCollection = getCollection(Unit.name);

	// build queries
	const linkedUnitsQuery = { tasks: { $in: [taskId] } };
	const unlinkedUnitsQuery = { tasks: { $nin: [taskId] } };

	// non curriculum users can only see the units by task which they own
	if (!(await userIsCurriculum(userId))) {
		linkedUnitsQuery.createdBy = userId;
		unlinkedUnitsQuery.createdBy = userId;
	}

	const linkedUnits = await UnitCollection.find(linkedUnitsQuery).fetchAsync();
	const unlinkedUnits =
		await UnitCollection.find(unlinkedUnitsQuery).fetchAsync();

	return {
		linkedUnits,
		unlinkedUnits,
	};
};

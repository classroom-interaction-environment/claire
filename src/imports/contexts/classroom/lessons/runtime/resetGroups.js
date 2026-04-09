import { check, Match } from "meteor/check";
import { getCollection } from "../../../../api/utils/getCollection";
import { Group } from "../../group/Group";

/**
 * Resets all groups of a given unit.
 * Removes all ad-hoc groups.
 * @async
 * @param options {object}
 * @param options.lessonId {string}
 * @param options.unitId {string}
 * @return {number} number of updated documents
 */
export const resetGroups = async (options) => {
	check(
		options,
		Match.ObjectIncluding({
			unitId: String,
		}),
	);

	return {
		updated: await updateGroups(options),
		removed: await removeAdhocGroups(options),
	};
};

const updateGroups = ({ unitId }) => {
	const query = { unitId, isAdhoc: { $ne: true } };
	const transform = { $set: { visible: [] } };
	const updateOptions = { multi: true };
	return getCollection(Group.name).updateAsync(query, transform, updateOptions);
};

const removeAdhocGroups = ({ unitId }) => {
	const query = { unitId, isAdhoc: true };
	return getCollection(Group.name).removeAsync(query);
};

export const removeGroups = (options) => {
	check(
		options,
		Match.ObjectIncluding({
			unitId: String,
		}),
	);

	const { unitId } = options;
	const query = { unitId };
	return getCollection(Group.name).removeAsync(query);
};

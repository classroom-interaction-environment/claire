import { Group } from "../../../classroom/group/Group";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { getCollection } from "../../../../api/utils/getCollection";
import { TaskResults } from "../TaskResults";
import { checkIsGroupMember } from "../../../classroom/lessons/helpers/checkIsGroupMember";

const getGroupDoc = createDocGetter(Group);

/**
 * Queries all task results for a given group by _id and item id.
 *
 * @param groupId {string}
 * @param itemId {string}
 * @returns {Mongo.Cursor}
 * @throws {PermissionDeniedError} if user is not in group
 */
export const getAllTasksByGroupAndItem = async ({
	userId,
	groupId,
	itemId,
}) => {
	// check if user is group member
	const groupDoc = await getGroupDoc(groupId);
	checkIsGroupMember(userId, groupDoc);
	const query = { groupId, itemId };
	return getCollection(TaskResults.name).find(query);
};

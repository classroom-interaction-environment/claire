import { Group } from "../Group";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { checkEditPermission } from "../../../../api/document/checkEditPermissions";
import { getCollection } from "../../../../api/utils/getCollection";

const getGroupDoc = createDocGetter({ name: Group.name });

export const toggleGroupMaterial = async ({
	groupId,
	userId,
	materialId,
	contextName,
}) => {
	const query = { _id: groupId };
	const groupDoc = await getGroupDoc(query);
	await checkEditPermission({ doc: groupDoc, userId });

	const mutation = {};
	const visibleList = groupDoc.visible || [];
	const hasMaterial = visibleList.some((v) => v._id === materialId);

	if (hasMaterial) {
		mutation.$pull = { visible: { _id: materialId } };
	} else {
		const visible = { _id: materialId, context: contextName };
		mutation.$addToSet = { visible };
	}
	return getCollection(Group.name).updateAsync(query, mutation);
};

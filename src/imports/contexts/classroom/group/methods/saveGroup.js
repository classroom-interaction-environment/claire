import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { Group } from "../Group";
import { checkEditPermission } from "../../../../api/document/checkEditPermissions";
import { getCollection } from "../../../../api/utils/getCollection";

const getGroupDoc = createDocGetter({ name: Group.name });

export const saveGroup = async ({ doc = {}, userId }) => {
	const { _id, ...groupDoc } = doc;
	const GroupCollection = getCollection(Group.name);

	if (_id) {
		const originalDoc = await getGroupDoc({ _id });
		await checkEditPermission({ doc: originalDoc, userId });
		return GroupCollection.updateAsync({ _id }, { $set: groupDoc });
	}

	return GroupCollection.insertAsync(groupDoc);
};

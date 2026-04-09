import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { Group } from "../Group";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { getUsersCollection } from "../../../../api/utils/getUsersCollection";
import { $in } from "../../../../api/utils/query/inSelector";
import { Users } from "../../../system/accounts/users/User";

const getGroupDoc = createDocGetter({ name: Group.name });

export const getGroupUsers = async ({ groupId, userId }) => {
	const groupDoc = await getGroupDoc({ _id: groupId });
	const { users, createdBy } = groupDoc;

	if (createdBy !== userId && !users.some((entry) => entry.userId === userId)) {
		throw new PermissionDeniedError("group.notAMember", {
			groupId,
			userId,
		});
	}

	const allUserIds = [];
	users.forEach((entry) => {
		if (entry.userId !== userId) {
			allUserIds.push(entry.userId);
		}
	});

	return getUsersCollection()
		.find({ _id: $in(allUserIds) }, { fields: Users.publicFields })
		.fetchAsync();
};

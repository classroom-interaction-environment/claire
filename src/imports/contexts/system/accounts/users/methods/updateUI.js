import { getUsersCollection } from "../../../../../api/utils/getUsersCollection";
import { ensureDocumentExists } from "../../../../../api/utils/document/ensureDocumentExists";

/**
 * Updates user's ui preferences
 * @param userId {string}
 * @param fluid {boolean}
 * @param classId {string}
 * @param guides {string[]}
 * @return {Promise<number>}
 */
export const updateUI = async ({ userId, fluid, classId, guides = [] }) => {
	const UsersCollection = getUsersCollection();
	const userDoc = await UsersCollection.findOneAsync({ _id: userId });
	ensureDocumentExists({
		document: userDoc,
		name: "users",
		docId: userId,
		userId,
	});

	const query = {};
	for (const key of guides) {
		query[`ui.guide.${key}`] = true;
	}
	if (typeof fluid === "boolean") {
		query["ui.fluid"] = fluid;
	}
	if (typeof classId === "string") {
		query["ui.classId"] = classId;
	}

	return getUsersCollection().updateAsync(userId, { $set: query });
};

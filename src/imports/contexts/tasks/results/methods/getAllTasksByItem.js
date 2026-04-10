import { TaskResults } from "../TaskResults";
import { getCollection } from "../../../../api/utils/getCollection";
import { getDocsForMember } from "../../../classroom/lessons/helpers/getDocsForMember";

/**
 * Creates a query for all given references that contain the combination of lessonId, taskId and itemId.
 * @param references {object}
 * @param references.lessonId {string}
 * @param references.taskId {string}
 * @param references.itemId {string}
 * @returns {Mongo.Cursor}
 */
export const getAllTasksByItem = async ({ userId, references }) => {
	const query = { $or: [] };

	for (const { lessonId, taskId, itemId } of references) {
		await getDocsForMember({ userId, lessonId });
		query.$or.push({ lessonId, taskId, itemId });
	}

	return getCollection(TaskResults.name).find(query);
};

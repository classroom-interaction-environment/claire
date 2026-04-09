import { Features } from "../../../../api/config/Features";
import { TaskWorkingState } from "../TaskWorkingState";
import { getCollection } from "../../../../api/utils/getCollection";

export const getMyTaskWorkingState = async ({
	lessonId,
	taskId,
	groupId,
	userId,
}) => {
	const createdBy = userId;
	const query = { lessonId, createdBy };

	if (taskId) {
		query.taskId = taskId;
	}

	if (groupId) {
		Features.ensure("groups");
		query.groupId = groupId;
	}

	return getCollection(TaskWorkingState.name).find(query);
};

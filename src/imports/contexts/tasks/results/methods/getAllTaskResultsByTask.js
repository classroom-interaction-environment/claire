import { TaskResults } from "../TaskResults";
import { getCollection } from "../../../../api/utils/getCollection";
import { getDocsForMember } from "../../../classroom/lessons/helpers/getDocsForMember";
import { isTeacher } from "../../../classroom/schoolclass/helpers/isTeacher";

/**
 * Returns all task results for a given task (presumed, that the user is teacher/member of the lesson).
 * @param lessonId {string}
 * @param taskId {string}
 * @param groupId {string=}
 * @returns {*}
 */
export const getAllTaskResultsByTask = async ({
	userId,
	lessonId,
	taskId,
	groupId,
}) => {
	const { classDoc } = await getDocsForMember({
		userId,
		lessonId,
		isStudent: true,
	});
	const isTeacherOfLesson = isTeacher(userId, classDoc);
	const query = { lessonId };

	if (!isTeacherOfLesson) {
		if (groupId) {
			query.groupId = groupId;
		} else {
			query.createdBy = userId;
		}
	}

	if (taskId) {
		query.taskId = taskId;
	}

	return getCollection(TaskResults.name).find(query);
};

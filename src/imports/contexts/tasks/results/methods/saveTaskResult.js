import { LessonErrors } from "../../../classroom/lessons/LessonErrors";
import { LessonStates } from "../../../classroom/lessons/LessonStates";
import { Task } from "../../../curriculum/curriculum/task/Task";
import { Group } from "../../../classroom/group/Group";
import { TaskResults } from "../TaskResults";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { getCollection } from "../../../../api/utils/getCollection";
import { GroupMode } from "../../../classroom/group/GroupMode";
import { getDocsForMember } from "../../../classroom/lessons/helpers/getDocsForMember";
import { taskIsEditable } from "../../../classroom/lessons/helpers/taskIsEditable";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";

const checkTask = createDocGetter({ name: Task.name });
const getGroupDoc = createDocGetter({ name: Group.name });
const getTaskResultDoc = createDocGetter({
	name: TaskResults.name,
	optional: true,
});

/**
 * Saves a response to an item of a given task
 * @param userId {string} the user to save the task
 * @param lessonId the lesson of the task
 * @param taskId the task
 * @param itemId the item the response is related to
 * @param response the response value(s)
 * @return {undefined|String|Number} returns the doc id if inserted (undefined if failed) or the update number 1 if
 *   updated (0 if failed)
 */

export const saveTaskResult = async ({
	userId,
	lessonId,
	taskId,
	itemId,
	groupId,
	groupMode,
	response,
}) => {
	const { lessonDoc } = await getDocsForMember({
		userId,
		lessonId,
		isStudent: true,
	});
	if (!LessonStates.isRunning(lessonDoc)) {
		throw new PermissionDeniedError(LessonErrors.unexpectedState, { lessonId });
	}

	await checkTask(taskId);

	// if groupId check group membership
	let groupDoc;

	if (groupId) {
		groupDoc = await getGroupDoc(groupId);

		if (!groupDoc.users.some((entry) => entry.userId === userId)) {
			throw new PermissionDeniedError("group.notAMember", {
				lessonId,
				taskId,
				groupId,
				userId,
			});
		}
	}

	// check if we can even edit the task
	if (!taskIsEditable({ lessonDoc, taskId, groupDoc })) {
		throw new PermissionDeniedError(TaskResults.errors.notEditable, {
			lessonId,
			taskId,
			userId,
		});
	}

	const createdBy = userId;
	const TaskResultCollection = getCollection(TaskResults.name);
	const isOverride = groupMode === GroupMode.override.value;
	const query = createQuery({
		lessonId,
		taskId,
		itemId,
		createdBy,
		groupId,
		isOverride,
	});
	const taskResultDoc = await getTaskResultDoc(query);

	if (taskResultDoc) {
		const updateDoc = { response };

		if (isOverride) {
			updateDoc.createdBy = createdBy;
		}

		return TaskResultCollection.updateAsync(taskResultDoc._id, {
			$set: updateDoc,
		});
	}

	const insertDoc = { lessonId, taskId, itemId, response };

	if (groupId) {
		insertDoc.groupId = groupId;
	}

	return TaskResultCollection.insertAsync(insertDoc);
};

const createQuery = ({
	lessonId,
	taskId,
	itemId,
	createdBy,
	groupId,
	isOverride,
}) => {
	const query = { lessonId, taskId, itemId, createdBy };
	if (groupId) {
		query.groupId = groupId;

		// in override mode any member can submit
		// a response for the group, overriding the previous one
		if (isOverride) {
			delete query.createdBy;
		}
	}
	return query;
};

import { SchoolClass } from "../SchoolClass";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { isStudent } from "../helpers/isStudent";
import { getCollection } from "../../../../api/utils/getCollection";
import { getClassDoc } from "../helpers/getClassDoc";

/**
 * Adds a student to a school class, if the person by given teacherId has permission
 * @server
 * @param classId
 * @param teacherId
 * @param userId
 * @return {Promise<*>}
 */
export const addStudent = async ({ classId, teacherId, userId }) => {
	const classDoc = await getClassDoc({ classId, teacherId });

	if (isStudent(userId, classDoc)) {
		throw new PermissionDeniedError(SchoolClass.errors.alreadyMember, {
			classId,
			userId,
		});
	}

	return getCollection(SchoolClass.name).updateAsync(classId, {
		$addToSet: { students: userId },
	});
};

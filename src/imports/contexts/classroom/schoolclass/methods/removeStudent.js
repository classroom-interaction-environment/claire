import { getClassDoc } from "../helpers/getClassDoc";
import { Meteor } from "meteor/meteor";
import { SchoolClass } from "../SchoolClass";
import { isStudent } from "../helpers/isStudent";
import { getCollection } from "../../../../api/utils/getCollection";

/**
 * Remove a student from a class if they are a member and the teacher is authorized
 * @param classId
 * @param userId
 * @param teacherId
 * @return {Promise<*>}
 */
export const removeStudent = async ({ classId, userId, teacherId }) => {
	const classDoc = await getClassDoc({ classId, teacherId });

	if (!isStudent(userId, classDoc)) {
		throw new Meteor.Error(
			"errors.permissionDenied",
			SchoolClass.errors.notMember,
			{ classId, userId },
		);
	}

	return getCollection(SchoolClass.name).updateAsync(classId, {
		$pull: { students: userId },
	});
};

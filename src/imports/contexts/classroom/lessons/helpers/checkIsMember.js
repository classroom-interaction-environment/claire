import { SchoolClass } from "../../schoolclass/SchoolClass";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { userIsAdmin } from "../../../../api/accounts/admin/userIsAdmin";
import { isTeacher } from "../../schoolclass/helpers/isTeacher";
import { isOwner } from "../../schoolclass/helpers/isOwner";
import { isStudent } from "../../schoolclass/helpers/isStudent";

/**
 * Checks if a given user is owner or one of the teachers of a class OR if she
 * is an Admin (privileged).
 * Throws if none of the conditions is true
 * @param classDoc
 * @param userId
 */
export const checkIsMember = async ({ classDoc, userId }) => {
	if (
		!isOwner(userId, classDoc) &&
		!isStudent(userId, classDoc) &&
		!isTeacher(userId, classDoc) &&
		!(await userIsAdmin(userId))
	) {
		throw new PermissionDeniedError(SchoolClass.errors.notMember, {
			classDoc,
			userId,
		});
	}
};

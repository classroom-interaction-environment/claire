import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { isMember } from "../../schoolclass/helpers/isMember";

const getClassDoc = createDocGetter({ name: SchoolClass.name });

/**
 * Check if a user is a member of a lesson (i.e. is a member of the class the lesson belongs to)
 * @param userId {string}
 * @param lessonDoc {object} - lesson document
 * @return {Promise<*|boolean>}
 */
export const isMemberOfLesson = async ({ userId, lessonDoc }) => {
	const classDoc = await getClassDoc(lessonDoc.classId);
	return isMember(userId, classDoc);
};

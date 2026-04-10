import { Lesson } from "../Lesson";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { checkIsTeacher } from "./checkIsTeacher";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { checkIsMember } from "./checkIsMember";

let getLessonDoc;
let getClassDoc;

/**
 * Gets lessonDoc and classDoc for a given userId and lessonId,
 * if the user is teacher of the class or admin
 * @private
 * @param userId {string}
 * @param lessonId {string}
 * @param isStudent {boolean}
 * @return {Promise<{classDoc: Object, lessonDoc: Object}>}
 */
export const getDocsForMember = async ({
	userId,
	lessonId,
	isStudent = false,
}) => {
	if (!getLessonDoc) getLessonDoc = createDocGetter({ name: Lesson.name });
	if (!getClassDoc) getClassDoc = createDocGetter({ name: SchoolClass.name });
	const lessonDoc = await getLessonDoc(lessonId ?? "");
	const classDoc = await getClassDoc(lessonDoc?.classId ?? "");

	if (isStudent) {
		await checkIsMember({ classDoc, userId });
	} else {
		await checkIsTeacher({ classDoc, userId });
	}
	return { lessonDoc, classDoc };
};

import { getCollection } from "../../../../api/utils/getCollection";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { isTeacher } from "../../schoolclass/helpers/isTeacher";
import { Lesson } from "../Lesson";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { isStudent } from "../../schoolclass/helpers/isStudent";

const getClassDoc = createDocGetter({ name: SchoolClass.name });

export const lessonsByClassTeacher = async ({ userId, classId }) => {
	const classDoc = await getClassDoc({ _id: classId });
	const userIsTeacher = isTeacher(userId, classDoc);
	return userIsTeacher ? getCollection(Lesson.name).find({ classId }) : null;
};

export const lessonsByClassStudent = async ({ classId, userId }) => {
	const classDoc = await getClassDoc({ _id: classId });
	const userIsStudent = isStudent(userId, classDoc);
	return userIsStudent ? getCollection(Lesson.name).find({ classId }) : null;
};

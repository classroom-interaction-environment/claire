import { userIsAdmin } from "../../../../api/accounts/admin/userIsAdmin";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { getCollection } from "../../../../api/utils/getCollection";
import { Lesson } from "../Lesson";
import { isMemberOfLesson } from "../runtime/isMemberOfLesson";
import { createDocGetter } from "../../../../api/utils/document/createDocGetter";

const getLessonDoc = createDocGetter({ name: Lesson.name });

export const singleLesson = async ({ lessonId, userId }) => {
	const lessonDoc = await getLessonDoc(lessonId);
	const isMember = await isMemberOfLesson({ userId, lessonDoc });

	if (!isMember && !(await userIsAdmin(userId))) {
		throw new PermissionDeniedError("lesson.notAMember");
	}

	return getCollection(Lesson.name).find({ _id: lessonId }, { limit: 1 });
};

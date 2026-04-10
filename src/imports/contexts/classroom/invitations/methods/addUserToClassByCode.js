import { createDocGetter } from "../../../../api/utils/document/createDocGetter";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { getUsersCollection } from "../../../../api/utils/getUsersCollection";
import { CodeInvitation } from "../CodeInvitations";
import { addStudent } from "../../schoolclass/methods/addStudent";
import { addTeacher } from "../../schoolclass/methods/addTeacher";
import { addUserToInvitation } from "./addUserToInvitation";
import { validateInvitation } from "../validation/validateInvitation";
import { hasRole } from "../../../../api/accounts/roles/hasRole";
import { Hierarchy } from "../../../../api/accounts/roles/Hierarchy";

const getClassDoc = createDocGetter({ name: SchoolClass.name });
const getCodeDoc = createDocGetter({ name: CodeInvitation.name });

export const addUserToClassByCode = async ({ code, userId }) => {
	// validate code
	let codeDoc;
	try {
		codeDoc = await getCodeDoc({ code });
	} catch (e) {
		const err = new PermissionDeniedError(CodeInvitation.errors.invalidCode, {
			code,
			userId,
		});
		err.cause = e;
		throw err;
	}
	if (!validateInvitation(codeDoc)) {
		throw new PermissionDeniedError(CodeInvitation.errors.invalidCode, {
			code,
			userId,
		});
	}

	// validate user
	const UsersCollection = getUsersCollection();
	const user = await UsersCollection.findOneAsync(userId);

	if (!user) {
		throw new PermissionDeniedError("user.notFound", { userId });
	}

	// check permissions to be added
	const { role } = codeDoc;
	if (!(await hasRole(userId, role, user.institution))) {
		throw new PermissionDeniedError(PermissionDeniedError.notInRole, {
			role,
			userId,
		});
	}

	// check class doc
	const { classId } = codeDoc;
	await getClassDoc(classId);
	const teacherId = codeDoc.createdBy;

	// add to class; membership check is performed in the methods
	if (role === Hierarchy.teacher) {
		await addTeacher({ classId, userId, teacherId });
	} else if (role === Hierarchy.student) {
		await addStudent({ classId, userId, teacherId });
		await UsersCollection.updateAsync(userId, {
			$set: { "ui.classId": classId },
		});
	} else {
		throw new PermissionDeniedError(SchoolClass.errors.invalidRole, {
			role,
			userId,
		});
	}

	// count up invitation usage
	await addUserToInvitation(codeDoc, userId);
};

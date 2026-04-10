/* global it */
import { Random } from "meteor/random";
import { SchoolClass } from "../../../imports/contexts/classroom/schoolclass/SchoolClass";
import { Lesson } from "../../../imports/contexts/classroom/lessons/Lesson";
import { LessonStates } from "../../../imports/contexts/classroom/lessons/LessonStates";
import { Unit } from "../../../imports/contexts/curriculum/curriculum/unit/Unit";
import { Task } from "../../../imports/contexts/curriculum/curriculum/task/Task";
import { stub } from "../stub";
import { getCollection } from "../../../imports/api/utils/getCollection";
import { Users } from "../../../imports/contexts/system/accounts/users/User";
import { DocNotFoundError } from "../../../imports/api/errors/types/DocNotFoundError";
import { getUsersCollection } from "../../../imports/api/utils/getUsersCollection";
import { expectThrow } from "../expectThrow";
import { PermissionDeniedError } from "../../../imports/api/errors/types/PermissionDeniedError";
import { LessonErrors } from "../../../imports/contexts/classroom/lessons/LessonErrors";
import { Admin } from "../../../imports/contexts/system/accounts/admin/Admin";

export const stubClassDoc = (classDoc) =>
	stub(getCollection(SchoolClass.name), "findOneAsync", async () => classDoc);
export const stubLessonDoc = (lessonDoc) =>
	stub(getCollection(Lesson.name), "findOneAsync", async () => lessonDoc);
export const stubUnitDoc = (unitDoc) =>
	stub(getCollection(Unit.name), "findOneAsync", async () => unitDoc);
export const stubUserDoc = ({ userId }) =>
	stub(getCollection(Users.name), "findOneAsync", async () => ({
		_id: userId,
	}));
export const stubTaskDoc = (taskDoc) =>
	stub(getCollection(Task.name), "findOneAsync", async () => taskDoc);
export const stubAdmin = (value) =>
	stub(getCollection(Admin.name), "countDocuments", () => value);
export const stubRole = (userId, role, scope) => {
	return stub(Roles, "userIsInRoleAsync", async (uid, r, s) => {
		if (uid === userId && r === role && s === scope) {
			return true;
		}
		return false;
	});
};
export const checkLesson = (fct, stateFct, fields = { lessonId: "_id" }) => {
	const userId = Random.id();
	const environment = { userId };
	const lessonIdField = fields.lessonId;

	it("throws if the given lesson does not exists", async () => {
		const lessonId = Random.id();
		await expectThrow({
			fn: () => fct.call(environment, { [lessonIdField]: lessonId }),
			error: DocNotFoundError.name,
			reason: "getDocument.docUndefined",
			details: { name: Lesson.name, query: lessonId },
		});
	});
	if (stateFct) {
		it(`throws if ${stateFct.name} is false`, async () => {
			const classId = await getCollection(SchoolClass.name).insertAsync({
				title: Random.id(),
				createdBy: userId,
				teachers: [userId],
				students: [userId],
			});
			const lessonId = await getCollection(Lesson.name).insertAsync({
				classId,
				createdBy: userId,
				unit: Random.id(),
			});
			await getUsersCollection().insertAsync({
				_id: userId,
				username: Random.id(),
			});
			await stubAdmin(0);
			stub(LessonStates, stateFct.name, () => false);

			await expectThrow({
				fn: () => fct.call(environment, { [lessonIdField]: lessonId }),
				error: LessonErrors.unexpectedState,
			});
		});
	}
};

export const checkClass = (
	fct,
	{ isTeacher = true, isStudent = false } = {},
	fields = { lessonId: "_id" },
) => {
	const userId = Random.id();
	const environment = { userId };
	const lessonIdField = fields.lessonId;

	it("throws if the given class does not exists", async () => {
		const lessonId = Random.id();
		const classId = Random.id();
		const lessonDoc = { _id: lessonId, classId };
		await stubLessonDoc(lessonDoc);
		await stubUserDoc(environment);
		await expectThrow({
			fn: () => fct.call(environment, { [lessonIdField]: lessonId }),
			error: DocNotFoundError.name,
			reason: "getDocument.docUndefined",
			details: { name: SchoolClass.name, query: classId },
		});
	});

	if (isTeacher) {
		it("throws if the user is not teacher of the class", async () => {
			const lessonId = Random.id();
			const classId = Random.id();
			const lessonDoc = { _id: lessonId, classId };
			const classDoc = { _id: classId };
			await stubLessonDoc(lessonDoc);
			await stubUserDoc(environment);
			await stubClassDoc(classDoc);
			await stubAdmin(0);
			await expectThrow({
				fn: () => fct.call(environment, { [lessonIdField]: lessonId }),
				error: PermissionDeniedError.name,
				reason: SchoolClass.errors.notTeacher,
			});
		});
	}

	if (isStudent) {
		it("throws if the user is not student of the class", async () => {
			const lessonId = Random.id();
			const classId = Random.id();
			const lessonDoc = { _id: lessonId, classId };
			const classDoc = { _id: classId };
			await stubLessonDoc(lessonDoc);
			await stubUserDoc(environment);
			await stubClassDoc(classDoc);
			await stubAdmin(0);
			await expectThrow({
				fn: () => fct.call(environment, { [lessonIdField]: lessonId }),
				error: PermissionDeniedError.name,
				reason: SchoolClass.errors.notMember,
			});
		});
	}
};

export const stubTeacherDocs = async ({
	classId = Random.id(),
	userId = Random.id(),
	lessonId = Random.id(),
	isAdmin = 0,
	classTitle = Random.id(5),
	unit = Random.id(),
	lessonProps = {},
	classProps = {},
} = {}) => {
	const lessonDoc = {
		_id: lessonId,
		classId,
		createdBy: userId,
		unit,
		...lessonProps,
	};
	const classDoc = {
		_id: classId,
		createdBy: userId,
		title: classTitle,
		...classProps,
	};
	await stubUserDoc({ userId });
	await stubLessonDoc(lessonDoc);
	await stubClassDoc(classDoc);
	await stubAdmin(isAdmin);
	return { userId, lessonDoc, classDoc };
};

export const stubStudentDocs = async (lessonMutators) => {
	const userId = Random.id();
	const lessonId = Random.id();
	const classId = Random.id();
	const lessonDoc = Object.assign(
		{},
		{ _id: lessonId, classId, createdBy: Random.id() },
		lessonMutators,
	);
	const classDoc = { _id: classId, createdBy: Random.id(), students: [userId] };

	await stubUserDoc({ userId });
	await stubLessonDoc(lessonDoc);
	await stubClassDoc(classDoc);
	await stubAdmin(0);

	return { userId, lessonDoc, classDoc };
};

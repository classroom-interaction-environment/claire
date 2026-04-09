import { Random } from "meteor/random";
import { restoreAll, stub } from "../../../../../tests/testutils/stub";
import {
	clearCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import { Users } from "../../../system/accounts/users/User";
import { Lesson } from "../Lesson";
import { LessonHelpers } from "../LessonHelpers";
import { Unit } from "../../../curriculum/curriculum/unit/Unit";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { Phase } from "../../../curriculum/curriculum/phase/Phase";
import { Task } from "../../../curriculum/curriculum/task/Task";
import { expect } from "chai";
import { DocNotFoundError } from "../../../../api/errors/types/DocNotFoundError";
import { stubClassDoc } from "../../../../../tests/testutils/doc/stubDocs";
import { expectThrow } from "../../../../../tests/testutils/expectThrow";

describe("LessonHelpers", () => {
	let LessonCollection;
	let SchoolClassCollection;

	beforeEach(() => {
		[LessonCollection, SchoolClassCollection] = mockCollections(
			Lesson,
			SchoolClass,
			Unit,
			Phase,
			Task,
			Users,
		);
	});

	afterEach(async () => {
		restoreAll();
		await clearCollections(Users, Lesson, Unit, SchoolClass, Phase, Task);
	});

	after(async () => {
		await restoreAllCollections();
	});

	describe(LessonHelpers.getClassDocIfStudent.name, () => {
		const { getClassDocIfStudent } = LessonHelpers;

		it("throws if user does not exists", async () => {
			const userId = Random.id();
			const classId = Random.id();
			const classDoc = {
				_id: classId,
				students: [Random.id()],
				createdBy: Random.id(),
			};
			await stubClassDoc(classDoc);
			await expectThrow({
				fn: () => getClassDocIfStudent({ userId, classId }),
				reason: "schoolClass.notMember",
				details: { classId, userId },
			});
		});
		it("throws if class does not exists", async () => {
			const userId = Random.id();
			const classId = Random.id();
			await expectThrow({
				fn: () => getClassDocIfStudent({ userId, classId }),
				reason: "getDocument.docUndefined",
				details: { name: SchoolClass.name, query: classId },
			});
		});
		it("throws is user is not student", async () => {
			const userId = Random.id();
			const classId = Random.id();
			await stubClassDoc({ _id: classId, students: [] });
			await expectThrow({
				fn: () => getClassDocIfStudent({ userId, classId }),
				reason: SchoolClass.errors.notMember,
				details: { classId, userId },
			});
		});
		it("returns the doc otherwise", async () => {
			const userId = Random.id();
			const classId = Random.id();
			const classDoc = { _id: classId, students: [userId] };
			await stubClassDoc(classDoc);
			const actualClassDoc = await getClassDocIfStudent({ userId, classId });
			expect(actualClassDoc).to.deep.equal(classDoc);
		});
	});
	describe(LessonHelpers.isMemberOfLesson.name, () => {
		const { isMemberOfLesson } = LessonHelpers;

		it("throws if lesson does not exists", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			await expectThrow({
				fn: () => isMemberOfLesson({ userId, lessonId }),
				reason: "getDocument.docUndefined",
				details: { name: Lesson.name, query: lessonId },
			});
		});
		it("throws, if class doc does not exists", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			const classId = Random.id();
			stub(LessonCollection, "findOneAsync", async () => ({
				_id: lessonId,
				classId,
			}));
			stub(SchoolClassCollection, "findOneAsync", async () => undefined);
			await expectThrow({
				fn: () => isMemberOfLesson({ userId, lessonId }),
				reason: "getDocument.docUndefined",
				details: { name: SchoolClass.name, query: classId },
			});
		});
		it("returns true if the given user is student of the lesson / class", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			const classId = Random.id();
			const classDoc = { _id: classId, students: [userId] };
			stub(LessonCollection, "findOneAsync", async () => ({
				_id: lessonId,
				classId,
			}));
			stub(SchoolClassCollection, "findOneAsync", async () => classDoc);
			expect(await isMemberOfLesson({ userId, lessonId })).to.equal(true);
		});
		it("returns true if the given user is teacher of the lesson / class", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			const classId = Random.id();
			const classDoc = { _id: classId, teachers: [userId] };
			stub(LessonCollection, "findOneAsync", async () => ({
				_id: lessonId,
				classId,
			}));
			stub(SchoolClassCollection, "findOneAsync", async () => classDoc);
			expect(await isMemberOfLesson({ userId, lessonId })).to.equal(true);
		});
		it("returns true if the given user is owner of the class", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			const classId = Random.id();
			const classDoc = { _id: classId, createdBy: userId };
			stub(LessonCollection, "findOneAsync", async () => ({
				_id: lessonId,
				classId,
			}));
			stub(SchoolClassCollection, "findOneAsync", async () => classDoc);
			expect(await isMemberOfLesson({ userId, lessonId })).to.equal(true);
		});
		it("returns false if the given user is not member of the lesson", async () => {
			const userId = Random.id();
			const lessonId = Random.id();
			const classdoc = { _id: Random.id() };
			stub(LessonCollection, "findOneAsync", async () => ({ _id: lessonId }));
			stub(SchoolClassCollection, "findOneAsync", async () => classdoc);
			expect(await isMemberOfLesson({ userId, lessonId })).to.equal(false);
		});
	});
	describe(LessonHelpers.isTeacher.name, () => {
		const { isTeacher } = LessonHelpers;
		it("throws if there is no lessonDoc", async () => {
			const defDoc = { userId: Random.id(), lessonId: Random.id() };
			await expectThrow({
				fn: () => isTeacher(defDoc),
				name: DocNotFoundError.name,
				details: { name: Lesson.name, query: defDoc.lessonId },
			});
		});
		it("throws if there is no linked classDoc", async () => {
			const userId = Random.id();
			const classId = Random.id();
			const unit = Random.id();
			const lessonDocId = await LessonCollection.insertAsync({
				createdBy: Random.id(),
				classId,
				unit,
			});
			const defDoc = { userId, lessonId: lessonDocId };
			await expectThrow({
				fn: () => isTeacher(defDoc),
				name: DocNotFoundError.name,
				details: { name: SchoolClass.name, query: classId },
			});
		});
		it("returns true if the user creator of the lesson", async () => {
			const userId = Random.id();
			const unit = Random.id();
			const lessonId = await LessonCollection.insertAsync({
				createdBy: userId,
				classId: Random.id(),
				unit,
			});
			const defDoc = { userId, lessonId };
			expect(await isTeacher(defDoc)).to.equal(true);
		});
		it("returns true if the user is in teachers of the class", async () => {
			const userId = Random.id();
			const unit = Random.id();
			const classId = await SchoolClassCollection.insertAsync({
				createdBy: Random.id(),
				title: Random.id(),
				teachers: [userId],
			});
			const lessonId = await LessonCollection.insertAsync({
				createdBy: Random.id(),
				classId,
				unit,
			});
			const defDoc = { userId, lessonId };
			expect(await isTeacher(defDoc)).to.equal(true);
		});
		it("returns true if the user is creator of the class", async () => {
			const userId = Random.id();
			const unit = Random.id();
			const classId = await SchoolClassCollection.insertAsync({
				createdBy: userId,
				title: Random.id(),
				teachers: [Random.id()],
			});
			const lessonId = await LessonCollection.insertAsync({
				createdBy: Random.id(),
				classId,
				unit,
			});
			const defDoc = { userId, lessonId };
			expect(await isTeacher(defDoc)).to.equal(true);
		});
		it("returns false otherwise", async () => {
			const userId = Random.id();
			const unit = Random.id();
			const classId = await SchoolClassCollection.insertAsync({
				createdBy: Random.id(),
				title: Random.id(),
				teachers: [Random.id()],
			});
			const lessonId = await LessonCollection.insertAsync({
				createdBy: Random.id(),
				classId,
				unit,
			});
			const defDoc = { userId, lessonId };
			expect(await isTeacher(defDoc)).to.equal(false);
		});
	});
});

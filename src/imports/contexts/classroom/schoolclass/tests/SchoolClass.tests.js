/* eslint-env mocha */
import { Random } from "meteor/random";
import { SchoolClass } from "../SchoolClass";
import { Lesson } from "../../lessons/Lesson";
import {
	clearAllCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import { DocNotFoundError } from "../../../../api/errors/types/DocNotFoundError";
import { onServerExec } from "../../../../api/utils/archUtils";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { restoreAll } from "../../../../../tests/testutils/stub";
import { expect } from "chai";
import { Users } from "../../../system/accounts/users/User";
import { Unit } from "../../../curriculum/curriculum/unit/Unit";
import { Phase } from "../../../curriculum/curriculum/phase/Phase";
import { isStudent } from "../helpers/isStudent";
import { isTeacher } from "../helpers/isTeacher";
import { isMember } from "../helpers/isMember";
import { count } from "../../../../utils/count";
import { expectThrow } from "../../../../../tests/testutils/expectThrow";
import { Admin } from "../../../system/accounts/admin/Admin";
import { ImageFiles } from "../../../files/image/ImageFiles";
import { TaskResults } from "../../../tasks/results/TaskResults";
import { TaskWorkingState } from "../../../tasks/state/TaskWorkingState";
import { AudioFiles } from "../../../files/audio/AudioFiles";
import { VideoFiles } from "../../../files/video/VideoFiles";
import { DocumentFiles } from "../../../files/document/DocumentFiles";
import { Beamer } from "../../../beamer/Beamer";

describe(SchoolClass.name, () => {
	let SchoolClassCollection;
	let LessonCollection;

	before(() => {
		[SchoolClassCollection, LessonCollection] = mockCollections(
			SchoolClass,
			Lesson,
			Users,
			Unit,
			Phase,
			Admin,
			TaskResults,
			TaskWorkingState,
			ImageFiles,
			AudioFiles,
			VideoFiles,
			DocumentFiles,
			Beamer,
		);
	});

	afterEach(async () => {
		await clearAllCollections();
		restoreAll();
	});

	after(async () => {
		await restoreAllCollections();
	});

	describe("helpers", () => {
		describe(isStudent.name, () => {
			it("returns false  if no classdoc is given", () => {
				expect(isStudent()).to.equal(false);
			});
			it("returns true if the given user is a student of the class", () => {
				const userId = Random.id();
				const classDoc = { students: [userId] };
				expect(isStudent(userId, classDoc)).to.equal(true);
			});
			it("returns false if the given user is not a student of the class", () => {
				const classDoc = { students: [Random.id()] };
				expect(isStudent(Random.id(), classDoc)).to.equal(false);
			});
		});
		describe(isTeacher.name, () => {
			it("returns false  if no classdoc is given", () => {
				expect(isTeacher()).to.equal(false);
			});
			it("returns true if the given user is a teacher of the class", () => {
				const userId = Random.id();
				const classDoc = { teachers: [userId] };
				expect(isTeacher(userId, classDoc)).to.equal(true);
			});
			it("returns false if the given user is not a teacher and not a creator of the class ", () => {
				const classDoc = { students: [], teachers: [Random.id()] };
				expect(isTeacher(Random.id(), classDoc)).to.equal(false);
			});
		});

		describe(isMember.name, () => {
			it("returns false if no classdoc is given", () => {
				expect(isMember()).to.equal(false);
			});
			it("returns true if the given user is a teacher of the class", () => {
				const userId = Random.id();
				const classDoc = { teachers: [userId] };
				expect(isMember(userId, classDoc)).to.equal(true);
			});
			it("returns true if the given user is student of the class", () => {
				const userId = Random.id();
				const classDoc = { teachers: [], students: [userId] };
				expect(isMember(userId, classDoc)).to.equal(true);
			});
			it("returns false otherwise", () => {
				const classDoc = { students: [Random.id()], teachers: [Random.id()] };
				expect(isMember(Random.id(), classDoc)).to.equal(false);
			});
			it("returns true if the given user is creator of the class", () => {
				const userId = Random.id();
				const classDoc = { teachers: [], createdBy: userId };
				expect(isMember(userId, classDoc)).to.equal(true);
			});
		});
	});

	onServerExec(() => {
		describe("methods", () => {
			const _getClass = SchoolClass.methods.get.run;
			const _myClasses = SchoolClass.methods.my.run;
			const createClass = SchoolClass.methods.create.run;
			const removeClass = SchoolClass.methods.remove.run;
			const _updateClass = SchoolClass.methods.update.run;
			const addStudent = SchoolClass.methods.addStudent.run;
			const removeStudent = SchoolClass.methods.removeStudent.run;

			describe(SchoolClass.methods.get.name, () => {
				it("is not implemented");
			});

			describe(SchoolClass.methods.my.name, () => {
				it("is not implemented");
			});

			describe(SchoolClass.methods.create.name, () => {
				it("creates a new school class doc", async () => {
					const classDocDef = { title: Random.id() };
					const environment = { userId: Random.id() };
					const classDocId = await createClass.call(
						environment,
						Object.assign({}, classDocDef),
					);
					const classDoc = await SchoolClassCollection.findOneAsync(classDocId);
					expect(classDoc.title).to.equal(classDocDef.title);
					expect(classDoc.createdBy).to.equal(environment.userId);

					// there are no students invited so none should be added
					// at the same time there is the only teacher the owner of the class
					expect(classDoc.students).to.deep.equal([]);
					expect(classDoc.teachers).to.deep.equal([environment.userId]);
				});
			});

			describe(SchoolClass.methods.update.name, () => {
				it("is not implemented");
			});

			describe(SchoolClass.methods.remove.name, () => {
				it("throws if the classDoc is not found", async () => {
					await expectThrow({
						fn: () =>
							removeClass.call({ userId: Random.id() }, { _id: Random.id() }),
						error: DocNotFoundError.name,
					});
				});
				it("throws if the user is not allowed to remove the class", async () => {
					const userId = Random.id();
					const classDoc = {
						title: Random.id(),
						createdBy: Random.id(),
						teachers: [userId],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					await expectThrow({
						fn: () => removeClass.call({ userId }, { _id: classId }),
						error: PermissionDeniedError.name,
						reason: "errors.notOwnerOrAdmin",
					});
				});
				it("removes the class (and only this class) by given _id", async () => {
					const userId = Random.id();
					const classDoc = {
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const otherClassId =
						await SchoolClassCollection.insertAsync(classDoc);

					await removeClass.call({ userId }, { _id: classId });
					expect(await count(SchoolClassCollection, { _id: classId })).to.equal(
						0,
					);
					expect(
						await count(SchoolClassCollection, { _id: otherClassId }),
					).to.equal(1);
				});
				it("removes all lessons of this (and only this) class", async () => {
					const userId = Random.id();

					// create class
					const classDoc = {
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const otherClassId =
						await SchoolClassCollection.insertAsync(classDoc);

					// create lesson
					let lessons = [];
					lessons.length = Math.floor(1 + Math.random() * 10);
					lessons.fill(0);
					lessons = await Promise.all(
						lessons.map(() =>
							LessonCollection.insertAsync({
								classId,
								title: Random.id(),
								createdBy: userId,
								unit: Random.id(),
							}),
						),
					);

					// create other lessons
					let otherLessons = [];
					otherLessons.length = Math.floor(1 + Math.random() * 10);
					otherLessons.fill(0);
					otherLessons = await Promise.all(
						otherLessons.map(() =>
							LessonCollection.insertAsync({
								classId: otherClassId,
								title: Random.id(),
								createdBy: userId,
								unit: Random.id(),
							}),
						),
					);

					// before
					for (const lessonId of lessons) {
						expect(await count(LessonCollection, { _id: lessonId })).to.equal(
							1,
						);
					}
					for (const lessonId of otherLessons) {
						expect(await count(LessonCollection, { _id: lessonId })).to.equal(
							1,
						);
					}
					expect(await count(LessonCollection, { classId })).to.equal(
						lessons.length,
					);

					// stub lesson runtime, make sure we don't remove
					// content from other lessons
					await removeClass.call({ userId }, { _id: classId });

					// after
					for (const lessonId of lessons) {
						expect(await count(LessonCollection, { _id: lessonId })).to.equal(
							0,
						);
					}
					for (const lessonId of otherLessons) {
						expect(await count(LessonCollection, { _id: lessonId })).to.equal(
							1,
						);
					}
					expect(await count(LessonCollection, { classId })).to.equal(0);
				});
			});

			describe(SchoolClass.methods.addStudent.name, () => {
				it("throws if no classdoc is found", async () => {
					const addDoc = { userId: Random.id(), classId: Random.id() };
					await expectThrow({
						fn: () => addStudent.call({ userId: Random.id() }, addDoc),
						error: DocNotFoundError.name,
					});
				});
				it("throws if the current user is not a teacher", async () => {
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: Random.id(),
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const userId = Random.id();
					await expectThrow({
						fn: () => addStudent.call({ userId }, { classId, userId }),
						error: PermissionDeniedError.name,
						reason: SchoolClass.errors.notTeacher,
					});
				});
				it("throws if the user to be added is already member of the class", async () => {
					const userId = Random.id();
					const studentId = Random.id();
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [studentId],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					await expectThrow({
						fn: () =>
							addStudent.call({ userId }, { classId, userId: studentId }),
						error: PermissionDeniedError.name,
						reason: SchoolClass.errors.alreadyMember,
					});
				});
				it("adds the user as student to the class", async () => {
					const userId = Random.id();
					const studentId = Random.id();
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const beforeAdd = await SchoolClassCollection.findOneAsync(classId);

					await addStudent.call({ userId }, { classId, userId: studentId });
					const updatedClass =
						await SchoolClassCollection.findOneAsync(classId);

					expect(updatedClass).to.not.deep.equal(beforeAdd);
					expect(updatedClass.students).to.deep.equal([studentId]);
				});
			});
			describe(SchoolClass.methods.removeStudent.name, () => {
				it("throws if no classdoc is found", async () => {
					const removeDoc = { userId: Random.id(), classId: Random.id() };
					await expectThrow({
						fn: () => removeStudent.call({ userId: Random.id() }, removeDoc),
						error: DocNotFoundError.name,
					});
				});
				it("throws if the current user is not a teacher", async () => {
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: Random.id(),
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const userId = Random.id();
					await expectThrow({
						fn: () => removeStudent.call({ userId }, { classId, userId }),
						error: PermissionDeniedError.name,
						reason: SchoolClass.errors.notTeacher,
					});
				});
				it("throws if the user to be added is NOT member of the class", async () => {
					const userId = Random.id();
					const studentId = Random.id();
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					await expectThrow({
						fn: () =>
							removeStudent.call({ userId }, { classId, userId: studentId }),
						error: PermissionDeniedError.name,
						reason: SchoolClass.errors.notMember,
					});
				});
				it("removes the student from the class", async () => {
					const userId = Random.id();
					const studentId = Random.id();
					const classDoc = {
						_id: Random.id(),
						title: Random.id(),
						createdBy: userId,
						teachers: [],
						students: [studentId],
					};
					const classId = await SchoolClassCollection.insertAsync(classDoc);
					const beforeAdd = await SchoolClassCollection.findOneAsync(classId);

					await removeStudent.call({ userId }, { classId, userId: studentId });
					const updatedClass =
						await SchoolClassCollection.findOneAsync(classId);

					expect(updatedClass).to.not.deep.equal(beforeAdd);
					expect(updatedClass.students).to.deep.equal([]);
				});
			});
		});
	});
});

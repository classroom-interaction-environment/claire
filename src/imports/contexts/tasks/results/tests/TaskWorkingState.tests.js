/* global describe it afterEach */
import { Random } from "meteor/random";
import { TaskWorkingState } from "../../state/TaskWorkingState";
import { LessonStates } from "../../../classroom/lessons/LessonStates";
import { restoreAll, stub } from "../../../../../tests/testutils/stub";
import {
	clearAllCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import {
	checkClass,
	checkLesson,
	stubStudentDocs,
	stubTaskDoc,
} from "../../../../../tests/testutils/doc/stubDocs";
import { expect } from "chai";
import { Task } from "../../../curriculum/curriculum/task/Task";
import { LessonErrors } from "../../../classroom/lessons/LessonErrors";
import { Lesson } from "../../../classroom/lessons/Lesson";
import { Users } from "../../../system/accounts/users/User";
import { SchoolClass } from "../../../classroom/schoolclass/SchoolClass";
import { DocNotFoundError } from "../../../../api/errors/types/DocNotFoundError";
import { Group } from "../../../classroom/group/Group";
import { Features } from "../../../../api/config/Features";
import { expectThrow } from "../../../../../tests/testutils/expectThrow";
import { Admin } from "../../../system/accounts/admin/Admin";

describe(TaskWorkingState.name, () => {
	let TaskWorkingStateCollection;

	before(() => {
		[TaskWorkingStateCollection] = mockCollections(
			TaskWorkingState,
			Lesson,
			Users,
			SchoolClass,
			Task,
			Group,
			Admin,
		);
	});

	afterEach(async () => {
		restoreAll();
		await clearAllCollections();
	});

	after(async () => {
		await restoreAllCollections();
	});

	describe("methods", () => {
		describe(TaskWorkingState.methods.saveState.name, () => {
			const saveState = TaskWorkingState.methods.saveState.run;

			checkLesson(saveState, LessonStates.isRunning, { lessonId: "lessonId" });
			checkClass(
				saveState,
				{ isTeacher: false, isStudent: true },
				{ lessonId: "lessonId" },
			);

			it("throws if the lesson does not exists", async () => {
				const lessonId = Random.id();
				await expectThrow({
					fn: () => saveState.call({}, { lessonId }),
					error: DocNotFoundError.name,
					details: { name: Lesson.name, query: lessonId },
				});
			});
			it("throws if the lesson is not running", async () => {
				const { lessonDoc, userId } = await stubStudentDocs();
				const lessonId = lessonDoc._id;
				await expectThrow({
					fn: () => saveState.call({ userId }, { lessonId }),
					error: LessonErrors.unexpectedState,
					reason: LessonErrors.expectedRunning,
				});
			});
			it("throws if the task does not exists", async () => {
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
				});
				const lessonId = lessonDoc._id;
				const taskId = Random.id();
				await expectThrow({
					fn: () => saveState.call({ userId }, { lessonId, taskId }),
					error: DocNotFoundError.name,
					details: { name: Task.name, query: taskId },
				});
			});
			it("throws if a given groupDoc does not exist by groupId id", async () => {
				const taskId = Random.id();
				const taskDoc = { _id: taskId };
				const visibleStudent = [{ _id: taskId, context: Task.name }];
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
					visibleStudent,
				});
				await stubTaskDoc(taskDoc);
				const insertDoc = {
					lessonId: lessonDoc._id,
					taskId: taskId,
					complete: false,
					page: 1,
					groupId: Random.id(),
					progress: 50,
				};
				stub(Features, "ensure", () => {});
				await expectThrow({
					fn: () => saveState.call({ userId }, insertDoc),
					error: DocNotFoundError.name,
					details: { name: Group.name, query: insertDoc.groupId },
				});
			});
			it("throws if a given groupId is rejected due to group features being disabled", async () => {
				const taskId = Random.id();
				const taskDoc = { _id: taskId };
				const visibleStudent = [{ _id: taskId, context: Task.name }];
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
					visibleStudent,
				});
				await stubTaskDoc(taskDoc);
				const insertDoc = {
					lessonId: lessonDoc._id,
					taskId: taskId,
					complete: false,
					page: 1,
					groupId: Random.id(),
					progress: 50,
				};
				stub(Features, "get", () => false);
				await expectThrow({
					fn: () => saveState.call({ userId }, insertDoc),
					message: 'Feature "groups" is expected to be true but is false',
				});
			});
			it("throws if the task is not editable", async () => {
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
				});
				const taskId = Random.id();
				const taskDoc = { _id: taskId };
				stubTaskDoc(taskDoc);
				const insertDoc = {
					lessonId: lessonDoc._id,
					taskId: taskId,
				};
				await expectThrow({
					fn: () => saveState.call({ userId }, insertDoc),
					error: TaskWorkingState.errors.taskNotEditable,
					details: { taskId },
				});
			});
			it("creates a new task progress document if none exists for the given task", async () => {
				const taskId = Random.id();
				const taskDoc = { _id: taskId };
				const visibleStudent = [{ _id: taskId, context: Task.name }];
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
					visibleStudent,
				});
				await stubTaskDoc(taskDoc);
				const insertDoc = {
					lessonId: lessonDoc._id,
					taskId: taskId,
					complete: false,
					page: 1,
					progress: 50,
				};
				expect(
					await TaskWorkingStateCollection.findOneAsync(insertDoc),
				).to.equal(undefined);

				const taskWorkingStateId = await saveState.call({ userId }, insertDoc);
				expect(
					await TaskWorkingStateCollection.findOneAsync(taskWorkingStateId),
				).to.be.a("object");

				const expectedDoc = Object.assign({}, insertDoc, {
					_id: taskWorkingStateId,
				});
				expect(
					await TaskWorkingStateCollection.findOneAsync(taskWorkingStateId),
				).to.deep.equal(expectedDoc);
			});
			it("updates an existing task progress document if exists for the given task", async () => {
				const taskId = Random.id();
				const taskDoc = { _id: taskId };
				const visibleStudent = [{ _id: taskId, context: Task.name }];
				const { lessonDoc, userId } = await stubStudentDocs({
					startedAt: new Date(),
					visibleStudent,
				});
				await stubTaskDoc(taskDoc);
				const insertDoc = {
					createdBy: userId,
					lessonId: lessonDoc._id,
					taskId: taskId,
					complete: false,
					page: 1,
					progress: 50,
				};
				expect(
					await TaskWorkingStateCollection.findOneAsync(insertDoc),
				).to.equal(undefined);
				const taskWorkingStateId =
					await TaskWorkingStateCollection.insertAsync(insertDoc);

				const updated = await saveState.call(
					{ userId },
					{
						lessonId: lessonDoc._id,
						taskId,
						complete: true,
						page: 5,
						progress: 100,
					},
				);
				expect(updated).to.equal(1);

				const updatedDoc =
					await TaskWorkingStateCollection.findOneAsync(taskWorkingStateId);
				expect(updatedDoc.complete).to.equal(true);
				expect(updatedDoc.page).to.equal(5);
				expect(updatedDoc.progress).to.equal(100);
			});
		});
	});
});

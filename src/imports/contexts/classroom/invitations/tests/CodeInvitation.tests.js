/* global describe it beforeEach afterEach */
import { Random } from "meteor/random";
import { expect } from "chai";
import { CodeInvitation } from "../CodeInvitations";
import { SchoolClass } from "../../schoolclass/SchoolClass";
import { Users } from "../../../system/accounts/users/User";
import { Admin } from "../../../system/accounts/admin/Admin";
import { Hierarchy } from "../../../../api/accounts/roles/Hierarchy";
import { DocNotFoundError } from "../../../../api/errors/types/DocNotFoundError";
import { PermissionDeniedError } from "../../../../api/errors/types/PermissionDeniedError";
import { onClientExec, onServerExec } from "../../../../api/utils/archUtils";
import { createCodeDoc } from "../../../../../tests/testutils/doc/createCodeDoc";
import { restoreAll } from "../../../../../tests/testutils/stub";
import { getInvitationOffset } from "../validation/getInvitationOffset";
import { invitationTimeLeft } from "../validation/invitationTimeLeft";
import { invitationExpired } from "../validation/invitationExpired";
import { invitationComplete } from "../validation/invitationComplete";
import { invitationPending } from "../validation/invitationPending";
import { getInvitationStatus } from "../validation/getInvitationStatus";
import { createInvitationURLQuery } from "../url/createInvitationURLQuery";
import { parseInvitationURLQuery } from "../url/parseInvitationURLQuery";
import { expectThrow } from "../../../../../tests/testutils/expectThrow";

describe(CodeInvitation.name, () => {
	describe("helpers (now refactored into functions)", () => {
		describe(getInvitationOffset.name, () => {
			it("Calculates a future date as unix timestamp", () => {
				const now = new Date();
				const time = now.getTime();

				const counts = Math.floor(Math.random() * 10);
				for (let i = 0; i < counts; i++) {
					const offset = getInvitationOffset(now, i);
					const expectedTime = time + i * 1000 * 60 * 60 * 24;
					expect(offset).to.equal(expectedTime);
				}
			});
		});

		describe(invitationTimeLeft.name, () => {
			it("Returns the time left in ms between now and the expiration date", () => {
				const now = new Date();
				const counts = Math.floor(Math.random() * 10);
				for (let i = 0; i < counts; i++) {
					const timeLeft = invitationTimeLeft(now, i);
					const expectedTimeLeft = i * 1000 * 60 * 60 * 24;
					const diff = Math.abs(expectedTimeLeft - timeLeft);
					expect(diff).to.be.below(10); // there are some miliseconds of diffing here and we
				}
			});
		});

		describe(invitationExpired.name, () => {
			it("returns true for a doc with invalid flag", () => {
				const invalid = { invalid: true, expires: 4, createdAt: new Date() };
				expect(invitationExpired(invalid)).to.equal(true);
			});

			it("returns true for a doc with expired date", () => {
				const expiredDoc = {
					expires: -3,
					createdAt: new Date(),
					invalid: false,
				};
				expect(invitationExpired(expiredDoc)).to.equal(true);
			});

			it("returns false for a valid doc with unexpired date", () => {
				const expiredDoc = {
					expires: 3,
					createdAt: new Date(),
					invalid: false,
				};
				expect(invitationExpired(expiredDoc)).to.equal(false);
			});

			it("throws, if params are missing", () => {
				expect(() => invitationExpired({})).to.throw();
			});
		});

		describe(invitationComplete.name, () => {
			it("returns false for a doc with no registered users", () => {
				const doc = createCodeDoc({ registeredUsers: null });
				expect(invitationComplete(doc)).to.equal(false);
			});

			it("returns false for a doc where the registered users are below max users", () => {
				const doc = createCodeDoc({
					registeredUsers: [Random.id()],
					maxUsers: 2,
				});
				expect(invitationComplete(doc)).to.equal(false);
			});

			it("returns true for a doc where all users have been completed", () => {
				const doc = createCodeDoc({
					registeredUsers: [Random.id(), Random.id()],
					maxUsers: 2,
				});
				expect(invitationComplete(doc)).to.equal(true);
			});

			it("throws, if registered users are greater than max users", () => {
				const doc = createCodeDoc({
					registeredUsers: [Random.id(), Random.id()],
					maxUsers: 1,
				});
				expect(() => invitationComplete(doc)).to.throw();
			});

			it("throws, if params are missing", () => {
				expect(() => invitationComplete({})).to.throw();
			});
		});

		describe(invitationPending.name, () => {
			it("returns false, if a doc is invalid", () => {
				const doc = createCodeDoc();
				doc.invalid = true;
				expect(invitationPending(doc)).to.equal(false);
			});
			it("returns false, if a doc is expired", () => {
				const doc = createCodeDoc({ expires: -2 });
				expect(invitationPending(doc)).to.equal(false);
			});
			it("returns false, if a doc is completed", () => {
				const doc = createCodeDoc({ registeredUsers: [Random.id()] });
				expect(invitationPending(doc)).to.equal(false);
			});
			it("returns true otherwise", () => {
				const doc = createCodeDoc();
				expect(invitationPending(doc)).to.equal(true);
			});
			it("throws if params are incomplete", () => {
				expect(() => invitationPending({})).to.throw();
			});
		});

		describe(getInvitationStatus.name, () => {
			it("gets the correct status for invalid", () => {
				const doc = createCodeDoc();
				doc.invalid = true;
				const status = getInvitationStatus(doc);
				expect(status).to.deep.equal(CodeInvitation.status.expired);
			});
			it("gets the correct status for expired", () => {
				const doc = createCodeDoc({ expires: -2 });
				const status = getInvitationStatus(doc);
				expect(status).to.deep.equal(CodeInvitation.status.expired);
			});
			it("gets the correct status for completed", () => {
				const doc = createCodeDoc({ registeredUsers: [Random.id()] });
				const status = getInvitationStatus(doc);
				expect(status).to.deep.equal(CodeInvitation.status.complete);
			});
			it("gets the correct status for pending", () => {
				const doc = createCodeDoc();
				const status = getInvitationStatus(doc);
				expect(status).to.deep.equal(CodeInvitation.status.pending);
			});
		});

		onClientExec(() => {
			describe(createInvitationURLQuery.name, () => {
				it("Creates a compressed version of URL query containing invitation credentials", () => {
					const doc = createCodeDoc();
					const queryString = createInvitationURLQuery(doc);
					expect(queryString).to.be.a("string");
					expect(queryString.length < JSON.stringify(doc).length).to.equal(
						true,
					);
				});
			});

			describe(parseInvitationURLQuery.name, () => {
				it("parses a compressed url query", () => {
					const doc = createCodeDoc();
					const queryDoc = {
						code: doc.code,
						firstName: doc.firstName,
						lastName: doc.lastName,
						email: doc.email,
						institution: doc.institution,
					};
					const queryString = createInvitationURLQuery(queryDoc);
					const parsed = parseInvitationURLQuery(queryString);
					expect(parsed).to.deep.equal(queryDoc);
				});
			});
		});
	});

	onServerExec(() => {
		const {
			mockCollections,
			clearCollections,
			restoreAllCollections,
		} = require("../../../../../tests/testutils/mockCollection");
		const {
			exampleUser,
		} = require("../../../../../tests/testutils/exampleUser");
		const {
			unstubUser,
			stubUser,
		} = require("../../../../../tests/testutils/stubUser");

		let CodeCollection;
		let SchoolClassCollection;

		let user;
		let userId;
		let environment;
		let classDoc;
		let classId;

		describe("methods", () => {
			before(() => {
				[CodeCollection, SchoolClassCollection] = mockCollections(
					CodeInvitation,
					SchoolClass,
					Admin,
					Users,
				);
			});

			beforeEach(async () => {
				user = exampleUser();
				userId = user._id;
				environment = { userId };
				classDoc = { createdBy: userId, title: Random.id() };
				classId = await SchoolClassCollection.insertAsync(classDoc);
			});

			afterEach(async () => {
				await unstubUser(user, userId);
				restoreAll();
				await clearCollections(Users, CodeInvitation, SchoolClass);
			});

			after(async () => {
				await restoreAllCollections();
			});

			const createInvitation = (...args) =>
				CodeInvitation.methods.create.run.call(environment, ...args);
			const forceExpire = (...args) =>
				CodeInvitation.methods.forceExpire.run.call(environment, ...args);
			const addToClass = (...args) =>
				CodeInvitation.methods.addToClass.run.call(environment, ...args);
			const removeInvitation = (...args) =>
				CodeInvitation.methods.remove.run.call(environment, ...args);
			const verify = (...args) =>
				CodeInvitation.methods.verify.run.call(environment, ...args);

			describe(CodeInvitation.methods.create.name, () => {
				it("throws, if the user cannot invite the given role", async () => {
					// expected errors
					const { admin, schoolAdmin, curriculum, teacher, student } =
						Hierarchy;
					const errorPairs = [
						[schoolAdmin, [admin, schoolAdmin]],
						[curriculum, [admin, schoolAdmin, curriculum]],
						[teacher, [admin, schoolAdmin, curriculum, teacher]],
						[student, [admin, schoolAdmin, curriculum, teacher, student]],
					];

					for (const entry of errorPairs) {
						const role = entry[0];
						const targets = entry[1];
						const { institution } = user;
						await stubUser(user, userId, [role], institution);

						for (const targetRole of targets) {
							const createDoc = {
								maxUsers: 1,
								expires: 1,
								role: targetRole,
								institution,
								classId,
							};

							await expectThrow({
								fn: () => createInvitation.call(environment, createDoc),
								error: "codeInvitation.createFailed",
								reason: CodeInvitation.errors.insufficientRole,
								details: { userId, role: targetRole },
							});
						}

						await unstubUser(user, userId);
					}
				});
				it("throws ,if a class is given but the user is not owner of the class or class does not exists", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);
					const createDoc = {
						maxUsers: 1,
						expires: 1,
						role: Hierarchy.student,
						classId: Random.id(),
						institution: user.institution,
					};

					// case a: classdoc not found
					await expectThrow({
						fn: () => createInvitation.call(environment, createDoc),
						error: DocNotFoundError.name,
						reason: "getDocument.docUndefined",
						details: { name: SchoolClass.name, query: createDoc.classId },
					});

					// case b: not owner
					createDoc.classId = await SchoolClassCollection.insertAsync({
						title: Random.id(),
						createdBy: Random.id(),
					});
					await expectThrow({
						fn: () => createInvitation.call({}, createDoc),
						error: PermissionDeniedError.name,
						reason: "schoolClass.notTeacher",
						details: { userId, classId: createDoc.classId },
					});
				});
				it("throws if user is not admin and institutions mismatch", async () => {
					const errorPairs = [
						[Hierarchy.schoolAdmin, [Hierarchy.teacher, Hierarchy.student]],
						[Hierarchy.teacher, [Hierarchy.student]],
					];

					for (const entry of errorPairs) {
						const role = entry[0];
						const targets = entry[1];
						await stubUser(user, userId, [role], user.institution);

						for (const targetRole of targets) {
							const createDoc = {
								maxUsers: 1,
								expires: 1,
								role: targetRole,
								institution: Random.id(),
								classId,
							};
							await expectThrow({
								fn: () => createInvitation.call({}, createDoc),
								error: CodeInvitation.errors.createFailed,
								reason: CodeInvitation.errors.institutionMismatch,
								details: { institution: createDoc.institution, userId },
							});
						}

						await unstubUser(user, userId);
					}
				});
				it("returns a new code doc", async () => {
					const expectedWorking = [
						[
							Hierarchy.admin,
							[
								Hierarchy.admin,
								Hierarchy.schoolAdmin,
								Hierarchy.teacher,
								Hierarchy.student,
							],
						],
						[Hierarchy.schoolAdmin, [Hierarchy.teacher, Hierarchy.student]],
						[Hierarchy.teacher, [Hierarchy.student]],
					];

					for (const entry of expectedWorking) {
						const role = entry[0];
						const targetRoles = entry[1];
						await stubUser(user, userId, [role], user.institution);

						for (const targetRole of targetRoles) {
							const classId = await SchoolClassCollection.insertAsync({
								createdBy: userId,
								title: Random.id(),
							});
							const createDoc = {
								role: targetRole,
								maxUsers: 1,
								expires: 1,
								institution: user.institution,
								classId,
							};

							const codeDocId = await createInvitation.call(
								{ userId },
								createDoc,
							);
							const codeDoc = await CodeCollection.findOneAsync(codeDocId);
							expect(codeDoc.code).to.be.a("string");
							expect(codeDoc.code).to.be.lengthOf(4);
							expect(codeDoc.role).to.equal(createDoc.role);
							expect(codeDoc.maxUsers).to.equal(createDoc.maxUsers);
							expect(codeDoc.expires).to.equal(createDoc.expires);
							expect(codeDoc.institution).to.equal(user.institution);
						}

						await unstubUser(user, userId);
					}
				});
			});

			describe(CodeInvitation.methods.remove.name, () => {
				it("removes a code document", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);

					const codeDocId = await CodeCollection.insertAsync({
						role: Hierarchy.student,
						code: Random.id(5),
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						classId,
					});

					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					const removed = await removeInvitation.call({ userId }, codeDoc);
					expect(removed).to.equal(1);
					expect(await CodeCollection.findOneAsync(codeDocId)).to.equal(
						undefined,
					);
				});
			});

			describe(CodeInvitation.methods.verify.name, () => {
				it("throws when the document does not exists", async () => {
					const codeDoc = { code: Random.id() };
					await expectThrow({
						fn: () => verify.call({}, codeDoc),
						error: CodeInvitation.errors.invalidLink,
						reason: CodeInvitation.errors.invalidLinkReason,
						details: { code: codeDoc.code },
					});
				});
				it("throws when the document is expired", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);

					const createDoc = createCodeDoc({
						expires: 1,
						classId,
						institution: user.institution,
					});
					const codeDocId = await CodeCollection.insertAsync(createDoc);
					await CodeCollection.updateAsync(codeDocId, {
						$set: { invalid: true, createdAt: new Date() },
					});

					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					await expectThrow({
						fn: () => verify.call({}, codeDoc),
						error: CodeInvitation.errors.invalidLink,
						reason: CodeInvitation.errors.invalidLinkReason,
						details: { code: codeDoc.code },
					});
				});
				it("throws when the document is completed", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);
					const createDoc = createCodeDoc({
						expires: 1,
						classId,
						institution: user.institution,
					});
					const codeDocId = await CodeCollection.insertAsync(createDoc);
					await CodeCollection.updateAsync(codeDocId, {
						$set: {
							createdAt: new Date(),
							registeredUsers: [Random.id()],
						},
					});

					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					await expectThrow({
						fn: () => verify.call({}, codeDoc),
						error: CodeInvitation.errors.invalidLink,
						reason: CodeInvitation.errors.invalidLinkReason,
						details: { code: codeDoc.code },
					});
				});
				it("returns the correct document for the given code", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);
					const createDoc = createCodeDoc({
						expires: 1,
						classId,
						institution: user.institution,
					});
					const codeDocId = await CodeCollection.insertAsync(createDoc);
					await CodeCollection.updateAsync(codeDocId, {
						$set: { createdAt: new Date(), registeredUsers: [] },
					});

					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					const verifiedDoc = await verify.call({ userId }, codeDoc);
					const classDoc = await SchoolClassCollection.findOneAsync(classId);
					const expectedDoc = {
						firstName: codeDoc.firstName,
						lastName: codeDoc.lastName,
						role: codeDoc.role,
						institution: codeDoc.institution,
						email: codeDoc.email,
						classId: codeDoc.classId,
						className: classDoc.title,
					};
					expect(verifiedDoc).to.deep.equal(expectedDoc);
				});
			});

			describe(CodeInvitation.methods.addToClass.name, () => {
				it("throws on invalid code", async () => {
					await stubUser(user, userId, [Hierarchy.teacher], user.institution);
					const createDoc = createCodeDoc({
						expires: 1,
						classId,
						institution: user.institution,
					});

					await expectThrow({
						fn: () => addToClass.call({ userId }, createDoc),
						error: PermissionDeniedError.name,
						reason: CodeInvitation.errors.invalidCode,
						details: { code: createDoc.code, userId },
					});
				});
				it("throws if the class does not exists", async () => {
					const randomClassId = Random.id();
					await stubUser(user, userId, [Hierarchy.student], user.institution);
					const createDoc = createCodeDoc({
						role: Hierarchy.student,
						code: Random.id(4),
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						createdAt: new Date(),
						classId: randomClassId,
					});

					const codeDocId = await CodeCollection.insertAsync(createDoc);
					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					await expectThrow({
						fn: () => addToClass.call({ userId }, codeDoc),
						error: DocNotFoundError.name,
						reason: "getDocument.docUndefined",
						details: { name: SchoolClass.name, query: randomClassId },
					});
				});
				it("throws if the user is already in the class", async () => {
					await stubUser(user, userId, [Hierarchy.student], user.institution);
					const classDocId = await SchoolClassCollection.insertAsync({
						createdBy: userId,
						title: Random.id(),
						students: [userId],
					});
					const createDoc = createCodeDoc({
						role: Hierarchy.student,
						code: Random.id(4),
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						createdAt: new Date(),
						classId: classDocId,
						createdBy: userId,
					});
					await CodeCollection.insertAsync(createDoc);
					await expectThrow({
						fn: () => addToClass.call({ userId }, { code: createDoc.code }),
						error: PermissionDeniedError.name,
						reason: SchoolClass.errors.alreadyMember,
						details: { classId: classDocId, userId },
					});
				});
				it("adds a student to the class", async () => {
					await stubUser(user, userId, [Hierarchy.student], user.institution);
					const otherStudentId = Random.id();
					const classDocId = await SchoolClassCollection.insertAsync({
						createdBy: userId,
						title: Random.id(),
						students: [otherStudentId],
					});
					const createDoc = createCodeDoc({
						role: Hierarchy.student,
						code: Random.id(4),
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						createdAt: new Date(),
						classId: classDocId,
						createdBy: userId,
					});
					const codeDocId = await CodeCollection.insertAsync(createDoc);
					await addToClass.call({ userId }, { code: createDoc.code });
					const classDoc = await SchoolClassCollection.findOneAsync(classDocId);
					expect(classDoc.students).to.deep.equal([otherStudentId, userId]);
					const updatedCodeDoc = await CodeCollection.findOneAsync(codeDocId);
					expect(updatedCodeDoc.registeredUsers).to.include(userId);
				});
			});

			describe(CodeInvitation.methods.forceExpire.name, () => {
				it("throws if the targeted doc does not exists", async () => {
					await stubUser(user, userId, [Hierarchy.admin], user.institution);
					const _id = Random.id();
					await expectThrow({
						fn: () => forceExpire.call({}, { _id }),
						error: DocNotFoundError.name,
						reason: "getDocument.docUndefined",
						details: { name: CodeInvitation.name, query: _id },
					});
				});
				it("throws if the targeted doc is not owned", async () => {
					await stubUser(user, userId, [Hierarchy.student], user.institution);
					const createDoc = {
						role: Hierarchy.student,
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						code: Random.id(4),
						classId,
					};

					const codeDocId = await CodeCollection.insertAsync(createDoc);
					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					expect(codeDoc.createdAt).to.equal(undefined);
					await expectThrow({
						fn: () => forceExpire.call({ userId }, { _id: codeDocId }),
						error: PermissionDeniedError.name,
						reason: "errors.notOwner",
						details: { context: CodeInvitation.name, userId, docId: codeDocId },
					});
				});
				it("expires a code invitation", async () => {
					await stubUser(user, userId, [Hierarchy.admin], user.institution);

					const createDoc = {
						role: Hierarchy.teacher,
						maxUsers: 1,
						expires: 1,
						institution: user.institution,
						createdBy: userId,
						code: Random.id(4),
						classId,
					};

					const codeDocId = await CodeCollection.insertAsync(createDoc);
					const codeDoc = await CodeCollection.findOneAsync(codeDocId);
					expect(codeDoc.invalid).to.equal(false);

					const updated = await forceExpire.call({ userId }, codeDoc);
					expect(updated).to.equal(1);

					const invalidDoc = await CodeCollection.findOneAsync(codeDocId);
					expect(invalidDoc.invalid).to.equal(true);
				});
			});
		});
	});
});

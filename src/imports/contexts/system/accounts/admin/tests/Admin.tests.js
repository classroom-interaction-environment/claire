/* eslint-env mocha */
import { Roles } from "meteor/alanning:roles";
import { Admin } from "../Admin";
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { Accounts } from "meteor/accounts-base";
import { UserFactory } from "../../../../../api/accounts/registration/UserFactory";
import { Users } from "../../users/User";
import { onServerExec } from "../../../../../api/utils/archUtils";
import { restoreAll, stub } from "../../../../../../tests/testutils/stub";
import {
	clearAllCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../../tests/testutils/mockCollection";
import { expect } from "chai";
import { count } from "../../../../../utils/count";
import { expectThrow } from "../../../../../../tests/testutils/expectThrow";
import { PermissionDeniedError } from "../../../../../api/errors/types/PermissionDeniedError";
import { DocNotFoundError } from "../../../../../api/errors/types/DocNotFoundError";
import { Hierarchy } from "../../../../../api/accounts/roles/Hierarchy";

describe(Admin.name, () => {
	let AdminCollection;
	let UsersCollection;

	before(() => {
		[AdminCollection, UsersCollection] = mockCollections(Admin, Users);
	});

	afterEach(async () => {
		restoreAll();
		await clearAllCollections();
	});

	after(async () => {
		await restoreAllCollections();
	});

	onServerExec(() => {
		describe("methods", () => {
			describe(Admin.methods.createUser.name, () => {
				const createUser = Admin.methods.createUser.run;

				it("creates a user and sends an enrollment email", async () => {
					const userId = Random.id();
					stub(UserFactory, "create", async () => userId);
					stub(Accounts, "sendEnrollmentEmail", async () => userId);

					const created = await createUser.call({}, {});
					expect(created).to.equal(userId);
					expect(await count(AdminCollection, { userId })).to.equal(0);
				});
				it("throws if the user is not admin but role is admin", async () => {
					const userId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const env = { userId };
					const args = {
						firstName: Random.id(),
						lastName: Random.id(),
						email: Random.id(),
						institution: Random.id(),
						role: Hierarchy.admin,
					};
					await expectThrow({
						fn: () => createUser.call(env, args),
						error: PermissionDeniedError.name,
						reason: "roles.notAdmin",
						details: { userId, ...args },
					});
				});
				it("makes a user admin if the role is given and current user is admin", async () => {
					stub(UserFactory, "create", async () => newUserId);
					stub(Accounts, "sendEnrollmentEmail", async () => newUserId);

					const userId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const newUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					await AdminCollection.insertAsync({ userId });
					expect(await count(AdminCollection, { userId })).to.equal(1);

					const env = { userId };
					const created = await createUser.call(env, { role: Hierarchy.admin });
					expect(created).to.equal(newUserId);
					expect(await count(AdminCollection, { userId })).to.equal(1);
					expect(await count(AdminCollection, { userId: newUserId })).to.equal(
						1,
					);
				});
			});

			describe(Admin.methods.removeUser.name, () => {
				const removeUser = Admin.methods.removeUser.run;

				it("throws if the user does not exists", async () => {
					const _id = Random.id();
					await expectThrow({
						fn: () => removeUser.call({}, { _id }),
						error: DocNotFoundError.name,
						reason: "user.notExist",
						details: { _id },
					});
				});

				it("throws if the users wants to delete themselves", async () => {
					const _id = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const env = { userId: _id };
					await expectThrow({
						fn: () => removeUser.call(env, { _id }),
						error: PermissionDeniedError.name,
						reason: "user.noSelfDelete",
						details: { userId: _id, _id },
					});
				});

				it("throws if the users is no admin but wants to remove an admin", async () => {
					const execUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const adminUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					await AdminCollection.insertAsync({ userId: adminUserId });
					const env = { userId: execUserId };
					await expectThrow({
						fn: () => removeUser.call(env, { _id: adminUserId }),
						error: PermissionDeniedError.name,
						reason: "roles.notAdmin",
						details: { userId: execUserId, _id: adminUserId },
					});
				});

				it("removes the user", async () => {
					const _id = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const { adminRemoved, rolesRemoved, userRemoved } =
						await removeUser.call({}, { _id });
					expect(adminRemoved).to.equal(0);
					expect(rolesRemoved).to.equal(0);
					expect(userRemoved).to.equal(1);
				});

				it("removes the roles", async () => {
					const _id = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					stub(Meteor.roleAssignment, "removeAsync", async () => 1);

					const { adminRemoved, rolesRemoved, userRemoved } =
						await removeUser.call({}, { _id });
					expect(adminRemoved).to.equal(0);
					expect(rolesRemoved).to.equal(1);
					expect(userRemoved).to.equal(1);
				});

				it("removes the admin if user is admin", async () => {
					const execUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					await AdminCollection.insertAsync({ userId: execUserId });

					const adminUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					await AdminCollection.insertAsync({ userId: adminUserId });

					stub(Meteor.roleAssignment, "removeAsync", async () => 1);

					const env = { userId: execUserId };
					const { adminRemoved, rolesRemoved, userRemoved } =
						await removeUser.call(env, { _id: adminUserId });
					expect(adminRemoved).to.equal(1);
					expect(rolesRemoved).to.equal(1);
					expect(userRemoved).to.equal(1);
				});
			});

			describe(Admin.methods.reinvite.name, () => {
				const reinviteUser = Admin.methods.reinvite.run;

				it("throws if the user does not exist", async () => {
					await expectThrow({
						fn: () => reinviteUser.call({}, {}),
						error: DocNotFoundError.name,
						reason: "errors.userNotExists",
						details: undefined,
					});

					const userId = Random.id();
					await expectThrow({
						fn: () => reinviteUser.call({}, { userId }),
						error: DocNotFoundError.name,
						reason: "errors.userNotExists",
						details: { userId },
					});
				});
				it("sends an enrollment email", async () => {
					const userId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					stub(Accounts, "sendEnrollmentEmail", () => userId);
					expect(await reinviteUser({ userId })).to.equal(userId);
				});
			});

			describe(Admin.methods.updateRole.name, () => {
				const updateRole = Admin.methods.updateRole.run;

				it("throws if the executing user does not exist", async () => {
					const userId = Random.id();
					const env = { userId };
					await expectThrow({
						fn: () => updateRole.call(env, {}),
						error: "admin.updateRoleFailed",
						reason: Admin.errors.USER_NOT_FOUND,
						details: { adminId: userId, userId: undefined },
					});

					const targetUserId = Random.id();
					await expectThrow({
						fn: () => updateRole.call(env, { userId: targetUserId }),
						error: "admin.updateRoleFailed",
						reason: Admin.errors.USER_NOT_FOUND,
						details: { adminId: userId, userId: targetUserId },
					});
				});
				it("throws if the user wants to change their own role", async () => {
					const userId = Random.id();
					const env = { userId };
					await expectThrow({
						fn: () => updateRole.call(env, env),
						error: "admin.updateRoleFailed",
						reason: "admin.noOwnRolesChangeAllowed",
						details: { adminId: userId, userId },
					});
				});
				it("throws if the role does not exist", async () => {
					const userId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const role = Random.id();
					const group = Random.id();
					const env = { userId: Random.id() };
					await expectThrow({
						fn: () => updateRole.call(env, { userId, role, group }),
						error: "admin.updateRoleFailed",
						reason: "roles.unknownRole",
						details: { userId, role, group, adminId: env.userId },
					});
				});
				it("updates the user's role", async () => {
					const userId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const role = Hierarchy.teacher;
					const group = Random.id();

					stub(Roles, "setUserRolesAsync", async () => true);
					stub(Roles, "userIsInRoleAsync", async () => userId);

					expect(await updateRole.call({}, { userId, role, group })).to.equal(
						1,
					);
				});
				it("makes admin if not already admin and will be admin", async () => {
					const execUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const env = { userId: execUserId };
					await AdminCollection.insertAsync({ userId: execUserId });

					const newAdminUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const role = Hierarchy.admin;

					stub(Roles, "setUserRolesAsync", async () => true);
					stub(Roles, "userIsInRoleAsync", async () => newAdminUserId);

					expect(
						await count(AdminCollection, { userId: newAdminUserId }),
					).to.equal(0);
					expect(
						await updateRole.call(env, { userId: newAdminUserId, role }),
					).to.equal(1);
					expect(
						await count(AdminCollection, { userId: newAdminUserId }),
					).to.equal(1);
				});
				it("removes admin if already admin and will be non-admin", async () => {
					const execUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const oldAdminUserId = await UsersCollection.insertAsync({
						username: Random.id(),
					});
					const env = { userId: execUserId };
					await AdminCollection.insertAsync({ userId: execUserId });
					await AdminCollection.insertAsync({ userId: oldAdminUserId });

					const role = Hierarchy.teacher;

					stub(Roles, "setUserRolesAsync", async () => true);
					stub(Roles, "userIsInRoleAsync", async () => oldAdminUserId);

					expect(
						await count(AdminCollection, { userId: oldAdminUserId }),
					).to.equal(1);
					expect(
						await updateRole.call(env, { userId: oldAdminUserId, role }),
					).to.equal(1);
					expect(
						await count(AdminCollection, { userId: oldAdminUserId }),
					).to.equal(0);
				});
			});

			describe(Admin.methods.users.name, () => {
				it("returns all users", async () => {
					const users = [
						{
							_id: Random.id(),
							services: {},
						},
						{
							_id: Random.id(),
							services: {},
						},
						{
							_id: Random.id(),
							services: {},
						},
					];

					for (const entry of users) {
						await UsersCollection.insertAsync(entry);
					}

					const ids = users.map(({ _id }) => _id);
					const response = await Admin.methods.users.run.call({}, { ids });
					response.forEach((userDoc, index) => {
						const expectedUser = users[index];
						expect(userDoc._id).to.equal(expectedUser._id);
						expect(userDoc.services).to.equal(undefined);
					});
				});
			});
		});
	});
});

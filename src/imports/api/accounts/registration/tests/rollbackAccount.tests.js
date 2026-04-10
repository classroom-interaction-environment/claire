import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { Admin } from "../../../../contexts/system/accounts/admin/Admin";
import { Users } from "../../../../contexts/system/accounts/users/User";
import { Roles } from "meteor/alanning:roles";
import { rollbackAccount } from "../rollbackAccount";
import {
	clearCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import { expect } from "chai";
import { count } from "../../../../utils/count";

describe(rollbackAccount.name, () => {
	let AdminCollection;
	let UsersCollection;

	before(() => {
		[AdminCollection, UsersCollection] = mockCollections(Admin, Users);
	});
	afterEach(async () => {
		await clearCollections(Admin, Users);
	});
	after(async () => {
		await restoreAllCollections();
	});
	it("removes a user from the account system", async () => {
		const userId = await UsersCollection.insertAsync({ username: Random.id() });
		expect(await count(UsersCollection)).to.equal(1);
		const { userRemoved, adminRemoved, rolesRemoved } =
			await rollbackAccount(userId);
		expect(userRemoved).to.equal(1);
		expect(adminRemoved).to.equal(0);
		expect(rolesRemoved).to.equal(0);
		expect(await count(UsersCollection)).to.equal(0);
	});
	it("removes all roles from the user", async () => {
		const userId = await UsersCollection.insertAsync({ username: Random.id() });
		const role = Random.id();
		const scope = Random.id();

		await Roles.createRoleAsync(role);
		await Roles.addUsersToRolesAsync(userId, role);
		await Roles.addUsersToRolesAsync(userId, role, scope);

		expect(await count(Meteor.roleAssignment, { "user._id": userId })).to.equal(
			2,
		);
		expect(await Roles.userIsInRoleAsync(userId, role)).to.equal(true);
		expect(await Roles.userIsInRoleAsync(userId, role, scope)).to.equal(true);

		const { userRemoved, rolesRemoved, adminRemoved } =
			await rollbackAccount(userId);
		expect(userRemoved).to.equal(1);
		expect(adminRemoved).to.equal(0);
		expect(rolesRemoved).to.equal(2);

		expect(await count(Meteor.roleAssignment, { "user._id": userId })).to.equal(
			0,
		);
		expect(await Roles.userIsInRoleAsync(userId, role)).to.equal(false);
		expect(await Roles.userIsInRoleAsync(userId, role, scope)).to.equal(false);
	});
	it("removes Admin status", async () => {
		const userId = await UsersCollection.insertAsync({ username: Random.id() });
		await AdminCollection.insertAsync({ userId });

		const { userRemoved, rolesRemoved, adminRemoved } =
			await rollbackAccount(userId);
		expect(userRemoved).to.equal(1);
		expect(adminRemoved).to.equal(1);
		expect(rolesRemoved).to.equal(0);

		expect(await count(AdminCollection, { userId })).to.equal(0);
	});
});

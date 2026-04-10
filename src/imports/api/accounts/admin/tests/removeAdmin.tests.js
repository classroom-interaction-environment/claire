import { Admin } from "../../../../contexts/system/accounts/admin/Admin";
import { removeAdmin } from "../removeAdmin";
import {
	mockCollections,
	clearCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import { Random } from "meteor/random";
import { expect } from "chai";
import { Users } from "../../../../contexts/system/accounts/users/User";
import { expectThrow } from "../../../../../tests/testutils/expectThrow";
import { count } from "../../../../utils/count";

let AdminCollection;
let UsersCollection;

describe(removeAdmin.name, () => {
	before(() => {
		[AdminCollection, UsersCollection] = mockCollections(Admin, Users);
	});

	afterEach(async () => {
		await clearCollections(Admin, Users);
	});

	after(async () => {
		await restoreAllCollections();
	});

	it("throws if no userId is given", async () => {
		const values = [null, undefined, 0, false, ""];
		for (const val of values) {
			await expectThrow({
				fn: () => removeAdmin(val),
				message: "Match error: Failed Match.Where validation",
			});
		}
	});

	it("throws if there is no user found for the given userId", async () => {
		const userId = Random.id();
		await expectThrow({
			fn: () => removeAdmin(userId),
			error: "removeAdmin.failed",
			reason: "removeAdmin.userNotFound",
			details: { userId },
		});
	});

	it("throws if the given userId is not in Admins", async () => {
		const userId = await UsersCollection.insertAsync({ username: Random.id() });
		await expectThrow({
			fn: () => removeAdmin(userId),
			error: "removeAdmin.failed",
			reason: "removeAdmin.notAdmin",
			details: { userId },
		});
	});

	it("removes the userId from the Admins", async () => {
		const userId = await UsersCollection.insertAsync({ username: Random.id() });
		const adminId = await AdminCollection.insertAsync({ userId });
		expect(await removeAdmin(userId)).to.equal(1);
		expect(await count(AdminCollection, { _id: adminId })).to.equal(0);
	});
});

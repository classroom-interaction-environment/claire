/* eslint-env mocha */
import { stubUser, unstubUser } from "../../../../../tests/testutils/stubUser";
import { expect } from "chai";
import { Random } from "meteor/random";
import { userExists } from "../userExists";
import {
	clearCollections,
	mockCollections,
	restoreAllCollections,
} from "../../../../../tests/testutils/mockCollection";
import { Admin } from "../../../../contexts/system/accounts/admin/Admin";
import { Users } from "../../../../contexts/system/accounts/users/User";

describe(userExists.name, () => {
	before(() => {
		mockCollections(Admin, Users);
	});

	afterEach(async () => {
		await clearCollections();
	});

	after(async () => {
		await restoreAllCollections();
	});

	it("returns false if no user exists for given id", async () => {
		const values = [
			null,
			undefined,
			0,
			-1,
			1,
			"",
			"invalid-id",
			[],
			{},
			{ someKey: "someValue" },
			Random.id(),
			{ userId: Random.id() },
		];
		for (const val of values) {
			expect(await userExists(val)).to.equal(false);
		}
	});

	it("returns true if the user exists", async () => {
		const _id = Random.id();
		await stubUser({ _id });
		expect(await userExists({ userId: _id })).to.equal(true);
		await unstubUser(true, true);
	});
});

/* eslint.env mocha */
import { Meteor } from "meteor/meteor";
import { loggedIn } from "../loggedIn";
import { assert } from "chai";
import { Random } from "meteor/random";
import { stub, restoreAll } from "../../../../../tests/testutils/stub";

describe("loggedIn", () => {
	let user;

	beforeEach(() => {
		user = { _id: Random.id(), username: Random.id() };
	});

	afterEach(() => {
		restoreAll();
	});

	it("returns false on a logged out user", () => {
		stub(Meteor, "userId", () => {});
		stub(Meteor, "user", () => {});
		assert.isFalse(loggedIn());
	});

	it("returns true on a logged in user", () => {
		stub(Meteor, "userId", () => {});
		stub(Meteor, "user", () => user);
		assert.isTrue(loggedIn());
	});

	it("returns true on  a logged in but maybe not yet subscribed user", () => {
		stub(Meteor, "userId", () => user._id);
		stub(Meteor, "user", () => {});
		assert.isTrue(loggedIn());
	});
});

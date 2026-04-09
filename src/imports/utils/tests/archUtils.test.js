/* global describe it beforeEach */
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import {
	onServerExec,
	onServer,
	onClient,
	onClientExec,
	auto,
	ensureClient,
	ensureServer,
	isomporph,
} from "../../api/utils/archUtils";
import { expect } from "chai";

describe("archUtils", () => {
	let value;
	let executed;
	let exec;
	beforeEach(() => {
		value = Random.id();
		executed = false;
		exec = () => {
			executed = true;
			return value;
		};
	});

	describe(onClient.name, () => {
		if (Meteor.isClient) {
			it("returns the given value on client", () => {
				const actual = onClient(value);
				expect(actual).to.equal(value);
			});
		}
		if (Meteor.isServer) {
			it("does not return returns the given value on server", () => {
				const actual = onClient(value);
				expect(actual).to.equal(undefined);
			});
		}
	});
	describe(onServer.name, () => {
		if (Meteor.isServer) {
			it("returns the given value on server", () => {
				const actual = onServer(value);
				expect(actual).to.equal(value);
			});
		}
		if (Meteor.isClient) {
			it("does not return returns the given value on client", () => {
				const actual = onServer(value);
				expect(actual).to.equal(undefined);
			});
		}
	});
	describe(onClientExec.name, () => {
		if (Meteor.isClient) {
			it("executed a function on the client", () => {
				const actual = onClientExec(exec);
				expect(actual).to.equal(value);
				expect(executed).to.equal(true);
			});
		}
		if (Meteor.isServer) {
			it("does not execute a function on the server", () => {
				const actual = onClientExec(exec);
				expect(actual).to.equal(undefined);
				expect(executed).to.equal(false);
			});
		}
	});
	describe(onServerExec.name, () => {
		if (Meteor.isServer) {
			it("executed a function on the server", () => {
				const actual = onServerExec(exec);
				expect(actual).to.equal(value);
				expect(executed).to.equal(true);
			});
		}
		if (Meteor.isClient) {
			it("does not execute a function on the client", () => {
				const actual = onServerExec(exec);
				expect(actual).to.equal(undefined);
				expect(executed).to.equal(false);
			});
		}
	});

	describe(auto.name, () => {
		it("always executes a function", () => {
			const actual = auto(exec);
			expect(actual).to.equal(value);
			expect(executed).to.equal(true);
		});
	});

	describe(isomporph.name, () => {
		const clientValue = Random.id();
		const serverValue = Random.id();

		const isomorphicFunc = isomporph({
			client: () => () => clientValue,
			server: () => () => serverValue,
		});

		if (Meteor.isClient) {
			it("executes the client function on client", () => {
				const actual = isomorphicFunc();
				expect(actual).to.equal(clientValue);
			});
		}
		if (Meteor.isServer) {
			it("executes the server function on server", () => {
				const actual = isomorphicFunc();
				expect(actual).to.equal(serverValue);
			});
		}
	});

	describe(ensureClient.name, () => {
		if (Meteor.isClient) {
			it("does not throw on client", () => {
				expect(() => ensureClient()).to.not.throw();
			});
		}
		if (Meteor.isServer) {
			it("throws on server", () => {
				expect(() => ensureClient()).to.throw(
					/Scope is expected to be client-only!/,
				);
			});
		}
	});

	describe(ensureServer.name, () => {
		if (Meteor.isServer) {
			it("does not throw on server", () => {
				expect(() => ensureServer()).to.not.throw();
			});
		}
		if (Meteor.isClient) {
			it("throws on client", () => {
				expect(() => ensureServer()).to.throw(
					/Scope is expected to be server-only!/,
				);
			});
		}
	});
});

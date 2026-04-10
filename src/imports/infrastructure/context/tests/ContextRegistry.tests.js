/* global describe it */
import { ContextRegistry } from "../ContextRegistry";
import { Random } from "meteor/random";
import { expect } from "chai";

describe(ContextRegistry.name, () => {
	beforeEach(() => {
		ContextRegistry.clear();
	});

	describe(ContextRegistry.validate.name, () => {
		it("validates a context against a minimal schema", () => {
			const _name = Random.id(6);
			const label = Random.id(6);
			const icon = Random.id(6);

			expect(() => ContextRegistry.validate({})).to.throw(
				"Match error: Missing key 'name'",
			);
			expect(() => ContextRegistry.validate({ icon, label })).to.throw(
				"Match error: Missing key 'name'",
			);
			expect(
				ContextRegistry.validate({
					name: Random.id(),
					label: Random.id(),
					icon: Random.id(),
				}),
			).to.equal(true);
		});
	});
	describe(ContextRegistry.add.name, () => {
		it("adds a context with default options", () => {
			const context = {
				name: Random.id(),
				label: Random.id(),
				icon: Random.id(),
				schema: {},
			};
			const added = ContextRegistry.add(context);
			expect(added).to.equal(true);
			expect(ContextRegistry.settings(context.name)).to.deep.equal({
				createCollection: true,
				createMethods: true,
				createPublications: true,
			});
		});
		it("adds a context with specific options", () => {
			const context = {
				name: Random.id(),
				label: Random.id(),
				icon: Random.id(),
				schema: {},
			};
			const added = ContextRegistry.add(context, {
				createPublications: false,
				createMethods: false,
				createCollection: false,
			});
			expect(added).to.equal(true);
			expect(ContextRegistry.settings(context.name)).to.deep.equal({
				createCollection: false,
				createMethods: false,
				createPublications: false,
			});
		});
	});
	describe(ContextRegistry.get.name, () => {
		it("returns a context, if it is registered", () => {
			expect(ContextRegistry.get(undefined)).to.equal(undefined);
			expect(ContextRegistry.get(Random.id())).to.equal(undefined);

			const context = {
				name: Random.id(),
				label: Random.id(),
				icon: Random.id(),
				schema: {},
			};
			ContextRegistry.add(context);

			expect(ContextRegistry.get(context.name)).to.equal(context);
		});
	});
	describe(ContextRegistry.settings.name, () => {
		it("returns a context-settings, if it is defined", () => {
			expect(ContextRegistry.settings(undefined)).to.equal(undefined);
			expect(ContextRegistry.settings(Random.id())).to.equal(undefined);

			const context = {
				name: Random.id(),
				label: Random.id(),
				icon: Random.id(),
				schema: {},
			};
			ContextRegistry.add(context);

			expect(ContextRegistry.settings(context.name)).to.deep.equal({
				createCollection: true,
				createMethods: true,
				createPublications: true,
			});
		});
	});
	describe(ContextRegistry.all.name, () => {
		const getContexts = (length) => {
			const allContexts = [];
			for (let i = 0; i < length; i++) {
				allContexts[i] = {
					name: Random.id(),
					label: Random.id(),
					icon: Random.id(),
					schema: {},
				};
			}
			return allContexts;
		};

		it("returns all unfiltered contexts if no filter is given", () => {
			const contexts = getContexts(10);
			contexts.forEach(ContextRegistry.add);

			const all = ContextRegistry.all();
			expect(all.length).to.equal(contexts.length);
		});
		it("returns all contexts, filtered by settings", () => {
			const contexts = getContexts(10);

			let flag = false;
			contexts.forEach((c) => {
				flag = !flag;
				ContextRegistry.add(c, { createCollection: flag });
			});

			const all = ContextRegistry.all({ createCollection: true });
			expect(all.length).to.equal(contexts.length / 2);

			all.forEach((c) => {
				expect(ContextRegistry.settings(c.name).createCollection).to.equal(
					true,
				);
			});
		});
	});
});

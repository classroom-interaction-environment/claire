/* eslint-env mocha */
import { Schema } from "../Schema";
import { expect } from "chai";
import { Defaults } from "../../defaults/Defaults";
import SimpleSchema from "meteor/aldeed:simple-schema";

Schema.extendOptions(Defaults.schemaOptions());

describe(Schema.name, () => {
	afterEach(() => {
		Schema.setDefault(Defaults.schema());
	});

	describe(Schema.create.name, () => {
		it("creates a schema product", () => {
			const definition = { foo: "bar" };
			const schema = Schema.create(definition);
			expect(schema).to.be.instanceof(SimpleSchema);
			expect(schema._schema).to.deep.equal({
				foo: {
					label: "Foo",
					optional: false,
					type: {
						definitions: [{ type: "bar" }],
					},
				},
			});
		});
	});
	describe(Schema.setDefault.name, () => {
		it("sets a default schema", () => {
			const defaultObj = { foo: "bar" };
			expect(Schema.setDefault(defaultObj)).to.equal(defaultObj);
		});
	});
	describe(Schema.getDefault.name, () => {
		it("gets a copy of the default", () => {
			const defaultObj = { foo: "bar" };
			Schema.setDefault(defaultObj);
			expect(Schema.getDefault()).to.not.equal(defaultObj);
			expect(Schema.getDefault()).to.deep.equal(defaultObj);
		});
	});
	describe(Schema.withDefault.name, () => {
		it("creates a schema with default", () => {
			const defaultObj = { foo: "bar" };
			Schema.setDefault(defaultObj);
			const schema = Schema.withDefault({ bar: "baz" });
			expect(schema).to.be.instanceof(SimpleSchema);
			expect(schema._schema).to.deep.equal({
				foo: {
					label: "Foo",
					optional: false,
					type: {
						definitions: [{ type: "bar" }],
					},
				},
				bar: {
					label: "Bar",
					optional: false,
					type: {
						definitions: [{ type: "baz" }],
					},
				},
			});
		});
	});
});

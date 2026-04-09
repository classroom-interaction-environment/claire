import { expect } from "chai";

export const isContext = (context) => {
	expect(context.name).to.be.a("string");
	if (context.label) expect(context.label).to.be.a("string");
	if (context.icon) expect(context.icon).to.be.a("string");
	if (context.schema) expect(context.schema).to.be.a("object");
	if (context.methods) expect(context.methods).to.be.a("object");
	if (context.publications) expect(context.publications).to.be.a("object");

	// TODO check all methods, that there is no run method on client

	// TODO when all current tests pass to refactor
	// TODO collection access on contexts
	// expect(context.collection).to.be.a('function')
};

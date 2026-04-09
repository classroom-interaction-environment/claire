import { expect } from "chai";

export const expectThrow = async ({ fn, error, message, reason, details }) => {
	try {
		await fn();
		expect.fail("Expected function to throw an error, but it did not.");
	} catch (e) {
		if (message) {
			expect(e.message).to.include(message);
		}
		if (error) {
			expect(e.error).to.include(error);
		}
		if (reason) {
			expect(e.reason).to.include(reason);
		}
		if (details) {
			expect(e.details).to.deep.equal(details);
		}
	}
};

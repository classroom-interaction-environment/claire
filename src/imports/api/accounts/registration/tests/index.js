/* eslint-env mocha */
describe("registration", () => {
	require("./PasswordConfig.tests");
	require("./UserFactory.tests");
	require("./registerUserSchema");
	require("./rollbackAccount.tests");
	require("./getEnrollmentExpiration.tests");
});

import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";

export const confirmResearch = async ({ email, token }) => {
	const user = await Accounts.findUserByEmail(email);
	const expectedToken = user?.research?.token;

	if (token !== expectedToken) {
		throw new Meteor.Error(
			"errors.500",
			"user.research.failed",
			"user.tokenInvalid",
		);
	}

	const confirmedAt = new Date();
	return Meteor.users.updateAsync(user._id, {
		$set: {
			"research.confirmed": true,
			"research.confirmedAt": confirmedAt,
		},
		$unset: {
			"research.token": 1,
		},
	});
};

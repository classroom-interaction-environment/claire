import { Meteor } from "meteor/meteor";
import { getUsersCollection } from "../../../../../api/utils/getUsersCollection";

export const getUser = async ({ _id, userId }) => {
	const userDoc = await getUsersCollection().findOneAsync(
		{ _id },
		{ fields: { services: 0 } },
	);
	if (!userDoc) {
		throw new Meteor.Error("user.invalidUser", "user.notFound", {
			userId: _id,
			calledBy: userId,
		});
	}

	// for others remove presence and emails
	if (_id !== userId) {
		delete userDoc.presence;
		delete userDoc.emails;
	}

	return userDoc;
};

import { Meteor } from "meteor/meteor";
import { Roles } from "meteor/alanning:roles";
import { stub, restore, isStubbed } from "./stub";
import { getUsersCollection } from "../../imports/api/utils/getUsersCollection";

export const stubUser = async (userObj, userId, roles, institution) => {
	if (Meteor.isClient)
		throw new Error("stubUser should only be used on the server");
	const userIsDefined = typeof userObj !== "undefined";
	const UsersCollection = getUsersCollection();

	if (userIsDefined) {
		if (userObj !== null) {
			await UsersCollection.upsertAsync(
				{ _id: userObj._id },
				{ $set: { ...userObj } },
			);
			stub(Meteor, "userId", () => userObj._id);
		} else {
			stub(Meteor, "userId", () => null);
		}

		stub(Meteor, "user", () => userObj);
	}

	if (!userIsDefined && typeof userId !== "undefined") {
		stub(Meteor, "user", async () => userObj || null);
		stub(Meteor, "userId", async () => userId);
	}

	if (typeof roles !== "undefined") {
		stub(Roles, "userIsInRoleAsync", async (id, role, domain) => {
			if (userObj) {
				return (
					id === userObj._id && roles.includes(role) && domain === institution
				);
			} else {
				return id === userId && roles.includes(role) && domain === institution;
			}
		});
		stub(Roles, "getRolesForUserAsync", async (uid, scope) => {
			return uid === (userObj ? userObj._id : userId) && scope === institution
				? roles
				: [];
		});
	}
	return userObj ? userObj._id : userId;
};

export const unstubUser = async (user, userId) => {
	let _id;

	if (user && isStubbed(Meteor, "user")) {
		_id = Meteor.user()?._id;
		restore(Meteor, "user");
	}

	if (userId && isStubbed(Meteor, "userId")) {
		_id = _id || Meteor.userId();
		restore(Meteor, "userId");
	}

	await getUsersCollection().removeAsync(_id);
	restore(Roles, "userIsInRoleAsync");
	restore(Roles, "getRolesForUserAsync");
};

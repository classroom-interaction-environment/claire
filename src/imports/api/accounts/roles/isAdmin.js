import { isomporph } from "../../utils/archUtils";
import { Meteor } from "meteor/meteor";
import { getUsersCollection } from "../../utils/getUsersCollection";
import { Hierarchy } from "./Hierarchy";

/**
 * Isomorphic function to determine whether a user is an admin.
 * @function isAdmin
 * @param {string} [userId=Meteor.userId()] - The _id of the user to check. Defaults to the currently logged-in user.
 * @return {boolean} True if the user is an admin, false otherwise.
 */
export const isAdmin = isomporph({
	client: () =>
		function isAdmin(userId = Meteor.userId()) {
			if (!userId) return false;
			const user = getUsersCollection().findOne(userId);

			if (!user) return false;
			return Roles.userIsInRole(userId, Hierarchy.admin, user.institution);
		},

	server: () => {
		const { userIsAdmin } = require("../admin/userIsAdmin");

		return function isAdmin(userId = Meteor.userId()) {
			if (!userId) return false;
			return userIsAdmin(userId);
		};
	},
});

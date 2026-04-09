import { Meteor } from "meteor/meteor";
import { isomporph } from "../../utils/archUtils";

/**
 * Isomorphic function to determine whether a user fulfills the criteria of editing a curriculum.
 * @function isCurriculum
 * @param {string} userId - The _id of the user to check.
 * @param {string} [scope] - The institutional scope of the curriculum permission.
 * @return {boolean} True if the user can edit curricula, false otherwise.
 */
export const isCurriculum = isomporph({
	client: () => {
		const { getUsersCollection } = require("../../utils/getUsersCollection");
		const { Hierarchy } = require("./Hierarchy");
		const { hasRole } = require("./hasRole");
		const { isAdmin } = require("./isAdmin");

		return (userId = Meteor.userId(), scope) => {
			let finalScope;
			if (!scope) {
				const user = getUsersCollection().findOne(userId);
				finalScope = user.institution;
			} else {
				finalScope = scope;
			}

			if (
				hasRole(userId, Hierarchy.curriculum, finalScope) ||
				hasRole(userId, Hierarchy.schoolAdmin, finalScope)
			) {
				return true;
			}

			return isAdmin(userId);
		};
	},
	server: () => {
		const { userIsCurriculum } = require("../userIsCurriculum");

		return (userId, scope) => {
			if (!userId) return false;
			return userIsCurriculum(userId, scope);
		};
	},
});

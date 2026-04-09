import { getCollection } from "../../utils/getCollection";
import { ensureServer } from "../../utils/archUtils";

/**
 * Determines, whether a given user (by id) is an Admin, independent from the assigned roles.
 * @async
 * @server
 * @param userId The _id of the user to check
 * @return {Promise<boolean>} true if the given user is part of the admin collection, false if not
 */
export const userIsAdmin = async (userId) => {
	ensureServer();
	if (!userId) return false;
	// require cannot be on top level, because of circular dependencies
	const { Admin } = require("../../../contexts/system/accounts/admin/Admin");
	const count = await getCollection(Admin.name).countDocuments({ userId });
	return count > 0;
};

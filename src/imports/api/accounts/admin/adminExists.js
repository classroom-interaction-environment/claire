import { Admin } from "../../../contexts/system/accounts/admin/Admin";
import { getCollection } from "../../utils/getCollection";

/**
 * Checks if an admin exists in the database.
 * @server
 * @return {Promise<boolean>}
 */
export const adminExists = async () => {
	const count = await getCollection(Admin.name).countDocuments({});
	return count > 0;
};

import { getCollection } from "../../../../api/utils/getCollection";
import { SchoolClass } from "../SchoolClass";

export const getMyClasses = async ({ userId, ids = [] }) => {
	const query = {
		$or: [{ students: userId }, { teachers: userId }, { createdBy: userId }],
	};

	if (ids?.length) {
		query.$or[0]._id = { $in: ids };
		query.$or[1]._id = { $in: ids };
		query.$or[2]._id = { $in: ids };
	}

	return getCollection(SchoolClass.name).find(query).fetchAsync();
};

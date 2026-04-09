import { Meteor } from "meteor/meteor";
import { getCollection } from "../../../api/utils/getCollection";
import { userIsAdmin } from "../../../api/accounts/admin/userIsAdmin";
import { getUsersCollection } from "../../../api/utils/getUsersCollection";
import { $in } from "../../../api/utils/query/inSelector";

/**
 * Gets all profile images (docs, not binary), linked to all
 * users of a given class.
 * @return {function({classId?: *}): *}
 */
export const profileImagesByClass = () => {
	// initialization phase
	const { SchoolClass } = require("../../classroom/schoolclass/SchoolClass");
	const { ProfileImages } = require("./ProfileImages");

	// run phase
	return async function ({ classId, skip }) {
		const classDoc = await getCollection(SchoolClass.name).findOneAsync(
			classId,
		);
		const { userId } = this;
		if (!classDoc) {
			throw new Meteor.Error("errors.docNotFound", classId);
		}
		if (!classDoc.createdBy === this.userId && !(await userIsAdmin(userId))) {
			throw new Meteor.Error("errors.permissionDenied", classId);
		}
		const students = classDoc.students || [];
		const teachers = classDoc.teachers || [];
		const allUsers = await getUsersCollection()
			.find(
				{ _id: $in(students.concat(teachers)) },
				{ fields: { profileImage: 1 } },
			)
			.fetchAsync();
		const allUsersImages = allUsers
			.map((user) => user?.profileImage)
			.filter(Boolean);

		const query = { _id: { $in: allUsersImages } };
		if (skip && skip.length > 0) {
			query._id.$nin = skip;
		}

		return getCollection(ProfileImages.name).find(query).fetchAsync();
	};
};

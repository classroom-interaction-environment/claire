import { createLog } from "../log/createLog";
import { userIsCurriculum } from "../accounts/userIsCurriculum";
import { userExists } from "../accounts/user/userExists";

const debug = createLog({ name: "validateUser", type: "debug" });

export const getUserCheck = () => {
	return async (user, file, type) => {
		const userId = user?._id;
		debug("for", file.name, type, user?.emails, userId);

		if (!(await userExists({ userId }))) {
			debug(`user ${userId} does not exist, deny`, type, file.name);
			return false;
		}

		const userIsOwner = user._id === file.userId;
		const fileIsCurriculum = file._master === true;

		if (type === "upload") {
			if (fileIsCurriculum && !(await userIsCurriculum(userId))) {
				debug("upload to curriculum as as non-curriculum user denied");
				return false;
			}

			// TODO validate content in meta {}
			debug("permitted upload");
			return true;
		}

		if (type === "remove") {
			return userIsOwner;
		}

		if (type === "download") {
			debug("download permitted");
			return true; // TODO determine read access by lesson and class membership
		}

		throw new Error("unexpected code reach");
	};
};

import { loggedOut } from "../../accounts/user/loggedOut";
import { Meteor } from "meteor/meteor";
import { Router } from "../Router";
import { check } from "meteor/check";
import { createLog } from "../../log/createLog";
import { Hierarchy } from "../../accounts/roles/Hierarchy";
import { hasAtLeastRole } from "../../accounts/roles/hasAtLeastRole";

const debug = createLog({ name: "adminTrigger", type: "debug", devOnly: true });

export const createAdminTrigger = ({ redirectRoute, forbiddenRoute }) => {
	check(redirectRoute.path, Function);
	check(forbiddenRoute.path, Function);

	return function adminTrigger() {
		if (loggedOut()) {
			debug("loggedOut");
			const location = Router.location();
			const fullPath = redirectRoute.path(encodeURIComponent(location));
			return Router.go(fullPath);
		}

		const userId = Meteor.userId();
		if (!hasAtLeastRole(userId, Hierarchy.schoolAdmin)) {
			debug("not an admin");
			return setTimeout(() => Router.go(forbiddenRoute.path()), 300);
		}

		debug("checks passed");
	};
};

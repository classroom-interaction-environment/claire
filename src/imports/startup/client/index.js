import { Meteor } from "meteor/meteor";
import { Blaze } from "meteor/blaze";
import { Template } from "meteor/templating";
import { Tracker } from "meteor/tracker";
import { Router } from "../../api/routes/Router";
import { Hierarchy } from "../../api/accounts/roles/Hierarchy";
import { dynamicImport } from "../../ui/utils/dynamicImport";
import { createLog } from "../../api/log/createLog";
import { UserRoles } from "../../api/roles/UserRoles";
import { getHighestRole } from "../../api/accounts/roles/getHighestRole";
import { userRoutesLoaded } from "../../api/routes/userRoutesLoaded";

if (Blaze.setExceptionHandler) Blaze.setExceptionHandler(console.error);
if (Template.stateName) Template.stateName("state");

const debug = createLog({ name: "routes", type: "debug" });

const minimalLoaded = dynamicImport([import("./minimal/index")]);

const reloadRoute = () => {
	setTimeout(() => {
		debug(
			"reloading route:",
			window.location.pathname + window.location.search,
		);
		Router.go(window.location.pathname + window.location.search);
	}, 150);
};

Tracker.autorun((computation) => {
	if (!minimalLoaded.get()) {
		return;
	}
	const userId = Meteor.userId();

	if (!userId) {
		return loadMinimalRoutes()
			.catch((e) => console.error(e))
			.then(() => {
				debug("minimal routes loaded");
				reloadRoute();
			});
	}

	// we need to wait for Meteor.user
	// because Meteor.userId is present before Meteor.user is ready
	// and we may need some info from the user document to determine roles
	if (!UserRoles.subscription.ready() || !Meteor.user()) {
		return debug(
			"waiting for user roles subscription...",
			Meteor.user(),
			UserRoles.subscription.ready(),
		);
	}
	debug("loading user routes for userId:", userId);
	loadUserRoutes(userId)
		.catch((e) => console.error(e))
		.then((role) => {
			userRoutesLoaded.set(true);
			debug(`${role}-specific routes loaded`);
			reloadRoute();
		});

	computation.stop();
});

async function loadUserRoutes(userId) {
	const role = await getHighestRole(userId);
	switch (role) {
		case Hierarchy.student:
			return (await loadStudent()) && role;
		case Hierarchy.teacher:
			return (await loadTeacher()) && role;
		case Hierarchy.curriculum:
			return (await loadCurriculum()) && role;
		case Hierarchy.schoolAdmin:
		case Hierarchy.admin:
			return (await loadAdmin()) && role;
		default:
			throw new Error("Undefined role:", role, "userId:", userId);
	}
}

async function loadMinimalRoutes() {
	debug("load minimal routes");
	return import("./minimal/routes");
}

async function loadStudent() {
	debug("load student routes");
	return import("./student/index");
}

async function loadTeacher() {
	debug("load teacher routes");
	return import("./teacher/index");
}

async function loadCurriculum() {
	await loadTeacher();
	debug("load admin routes");
	return import("./curriculum/index");
}

async function loadAdmin() {
	await loadTeacher();
	debug("load admin routes");
	return import("./admin/index");
}

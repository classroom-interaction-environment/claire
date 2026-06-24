import { TeacherRoutes } from "../../../api/routes/teacher/TeacherRoutes";
import { Router } from "../../../api/routes/Router";
import { Routes } from "../../../api/routes/Routes";
import { teacherContainer } from "../../../ui/containers/teacher/teacherContainer";
import { setFatalError } from "../../../ui/components/fatal/fatal";
import { userIsCurriculum } from "../../../api/accounts/userIsCurriculum";
import "../../../ui/containers/beamer/beamerContainer";
import { createLog } from "../../../api/log/createLog";

const debug = createLog({ name: "routes/teacher", type: "debug" });

Router.setDefaultTarget(teacherContainer);

// if the user is a curriculum user, we first load the CurriculumRoutes
const loadCurriculumRoutes = async () => {
	const isCurriculum = await userIsCurriculum(Meteor.userId());
	if (isCurriculum) {
		debug("load curriculum routes");
		const { CurriculumRoutes } = await import(
			"../../../api/routes/curriculum/CurriculumRoutes"
		);
		Object.assign(TeacherRoutes, CurriculumRoutes);
	}

	// for "normal" teachers we only load the TeacherRoutes
	loadRoutes(TeacherRoutes);
};

const loadRoutes = (target) => {
	debug("load teacher routes");
	Object.keys(target).forEach((key) => {
		Routes[key] = target[key];
	});

	Object.keys(Routes).forEach((key) => {
		const route = Routes[key];
		route.key = key;
		Router.register(route);
	});
};

loadCurriculumRoutes().catch(setFatalError);
